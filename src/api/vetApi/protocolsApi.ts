import { DEMO_NOW, http } from '../http';
import { type Actor, addAudit, type ProtocolState } from '../managerApi';
import type { Horse } from '../trainerApi';
import type { VetCase, InventoryItem, ProtoPhase, Protocol, Shipment, VetHorse } from './types';
import { isOpenProtocol } from './labels';
import { dateKey, isDate } from './dates';
import { get, nextId, now, min, addHistory, lastEta, phaseRequiredBy, stockShort, watchFields, saveProtocol, goTo, releaseHeld } from './shared';
import { ITEM_ADDABLE, withAddedItems, type ItemAddition } from './labels';
import { phaseIsPaid, phaseProgressOf, type PhaseProgress } from '../../features/protocol-phases/phaseState';

export const protocolsApi = {
  async getProtocols() {
    const [protocols, horses, shipments] = await Promise.all([get<Protocol[]>('/protocols'), get<VetHorse[]>('/horses'), get<Shipment[]>('/shipments')]);
    return { protocols, horses, shipments };
  },

  async getProtocol(id: string) {
    const p = await get<Protocol>(`/protocols/${id}`);
    const [horse, vetCase, versions, shipments] = await Promise.all([
      get<VetHorse>(`/horses/${p.horseId}`), get<VetCase>(`/vetCases/${p.caseId}`).catch(() => null),
      get<Protocol[]>('/protocols', { caseId: p.caseId }), get<Shipment[]>('/shipments'),
    ]);
    return { protocol: p, horse, vetCase, versions: versions.sort((a, b) => b.version - a.version), shipments: shipments.filter((s) => s.forRef === p.id) };
  },

  async getPrescribableItems() {
    return (await get<InventoryItem[]>('/inventory')).filter((i) => i.category !== 'Thức ăn');
  },

  async getProtocolForm(opts: { horseId?: string; caseId?: string; replaceId?: string }) {
    const [horses, cases, inventory] = await Promise.all([get<VetHorse[]>('/horses'), get<VetCase[]>('/vetCases'), get<InventoryItem[]>('/inventory')]);
    const replacing = opts.replaceId ? await get<Protocol>(`/protocols/${opts.replaceId}`) : null;
    const allProtocols = !replacing ? await get<Protocol[]>('/protocols') : [];
    const blockedBy = allProtocols.find((p) => p.horseId === opts.horseId && isOpenProtocol(p)) ?? null;
    const replacingCase = replacing
      ? cases.find((c) => String(c.id) === String(replacing.caseId))
        ?? await get<VetCase>(`/vetCases/${replacing.caseId}`).catch(() => null)
      : null;
    const visibleCases = cases.filter((c) => c.status !== 'CLOSED' || (replacing && String(c.id) === String(replacing.caseId)));
    if (replacingCase && !visibleCases.some((c) => String(c.id) === String(replacingCase.id))) visibleCases.push(replacingCase);
    return { horses, cases: visibleCases, inventory: inventory.filter((i) => i.category !== 'Thức ăn'), replacing, blockedBy };
  },

  async createProtocol(input: { horseId: string; caseId: string; diagnosis: string; requiredBy: string; phases: ProtoPhase[]; replaces?: string | null }, send: boolean, actor: Actor) {
    const horse = await get<Horse>(`/horses/${input.horseId}`);
    const vetCase = await get<VetCase>(`/vetCases/${input.caseId}`).catch(() => { throw new Error('Chọn ca khám cho phác đồ.'); });
    if (vetCase.horseId !== horse.id) throw new Error('Ca khám không thuộc ngựa này.');
    if (vetCase.status === 'CLOSED') throw new Error('Ca khám đã đóng.');
    const diagnosis = min(input.diagnosis, 5, 'Chẩn đoán');
    if (!input.phases.length) throw new Error('Phác đồ cần ít nhất 1 giai đoạn.');
    input.phases.forEach((ph, i) => {
      if (!ph.name.trim()) throw new Error(`Giai đoạn ${i + 1}: nhập tên giai đoạn.`);
      if (!isDate(ph.startDate)) throw new Error(`Giai đoạn ${i + 1}: ngày bắt đầu theo dạng dd/mm/yyyy.`);
      if (!Number.isInteger(ph.days) || ph.days < 1) throw new Error(`Giai đoạn ${i + 1}: thời lượng ít nhất 1 ngày.`);
      if (ph.items.some((it) => !Number.isInteger(it.qty) || it.qty < 1)) throw new Error(`Giai đoạn ${i + 1}: số lượng thuốc/vật tư phải là số nguyên ≥ 1.`);
    });
    if (!input.phases.some((ph) => ph.items.length)) throw new Error('Thêm ít nhất 1 thuốc/vật tư để gửi kiểm tồn.');
    if (input.requiredBy && !isDate(input.requiredBy)) throw new Error('Ngày cần thuốc theo dạng dd/mm/yyyy.');

    const all = await get<Protocol[]>('/protocols');
    if (!input.replaces && all.some((p) => p.horseId === input.horseId && p.state !== 'CANCELLED')) throw new Error('Ngựa đã có phác đồ. Chỉ có thể tạo lại sau khi phác đồ cũ được hủy.');
    const replaced = input.replaces ? all.find((p) => p.id === input.replaces) : undefined;
    if (input.replaces && (!replaced || !isOpenProtocol(replaced))) throw new Error('Phác đồ cũ không còn hiệu lực để thay thế.');
    const id = nextId(all.map((p) => p.id), 'PD-');
    const states: ProtocolState[] = send ? ['DRAFT', 'WAITING_STOCK_CHECK'] : ['DRAFT'];
    const draft: Protocol = {
      id, version: replaced ? replaced.version + 1 : 1, replaces: replaced?.id ?? null, supersededBy: null,
      horseId: horse.id, horse: horse.name, caseId: vetCase.id, diagnosis, vet: actor.name, createdAt: DEMO_NOW.date,
      requiredBy: input.requiredBy || input.phases[0].startDate,
      phases: input.phases.map((ph, i) => ({ ...ph, no: i + 1, name: ph.name.trim(), goal: ph.goal.trim() })),
      state: states[states.length - 1], path: states, stock: null, wait: null, delayed: false, progress: [], outcome: null,
      label: '', tone: 'neutral', cost: 0, open: true, materials: [], note: send ? 'Đã gửi kho kiểm tra tồn, chờ phản hồi.' : 'Bản nháp chưa gửi kho.',
      phaseProgress: input.phases.map((ph) => ({ phaseNo: ph.no, status: 'WAITING_PAYMENT' as const })),
      phaseBilling: input.phases.map((ph) => ({ phaseNo: ph.no, invoiceId: null, amount: ph.items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0), status: 'UNPAID' as const })),
      log: [{ who: `BS ${actor.name}`, text: send ? `gửi kiểm tồn${replaced ? ` · thay thế ${replaced.id}` : ''}` : 'lưu bản nháp', at: now() }],
    };
    const { data } = await http.post<Protocol>('/protocols', { ...draft, ...watchFields(draft, horse.trainingLocked) });
    const invoices = await get<{ id: string }[]>('/invoices');
    const phaseBilling = (data.phaseBilling ?? []).map((billing) => ({
      ...billing,
      status: billing.amount === 0 ? 'PAID' as const : billing.status,
      invoiceId: billing.amount === 0 ? null : nextId(invoices.map((invoice) => invoice.id), 'INV-', 4),
    }));
    for (const billing of phaseBilling.filter((item) => item.invoiceId)) {
      const phase = data.phases.find((item) => item.no === billing.phaseNo)!;
      const invoiceId = billing.invoiceId as string;
      await http.post('/invoices', { id: invoiceId, horse: horse.name, owner: horse.owner, horseId: horse.id, period: DEMO_NOW.date.slice(3), dueDate: DEMO_NOW.date, amount: billing.amount, overdueDays: 0, status: 'UNPAID', issuedAt: DEMO_NOW.date, service: `Phác đồ ${data.id} · giai đoạn ${billing.phaseNo}`, lines: [{ label: `Phác đồ ${data.id} · ${phase.name} · GĐ${billing.phaseNo}`, kind: 'MED', period: DEMO_NOW.date.slice(3), amount: billing.amount, protocolId: data.id, phaseNo: billing.phaseNo }] });
      invoices.push({ id: invoiceId });
    }
    const saved = await http.patch<Protocol>(`/protocols/${data.id}`, { phaseBilling });
    await http.patch(`/vetCases/${vetCase.id}`, { protocolId: data.id });
    if (send && replaced) await protocolsApi.supersede(replaced, data.id, actor);
    await addAudit(actor, { action: send ? 'SEND_STOCK_CHECK' : 'CREATE_PROTOCOL_DRAFT', label: send ? 'Gửi kiểm tra tồn kho' : 'Lưu phác đồ nháp', object: `${data.id} · ${horse.name}`, area: 'med', to: data.state, reason: replaced ? `Phiên bản ${data.version}, thay ${replaced.id}` : diagnosis });
    return saved.data;
  },

  async sendStockCheck(p: Protocol, actor: Actor) {
    if (p.state !== 'DRAFT') throw new Error('Chỉ gửi kiểm tồn cho bản nháp.');
    const data = await saveProtocol(p, { ...goTo(p, 'WAITING_STOCK_CHECK'), note: 'Đã gửi kho kiểm tra tồn, chờ phản hồi.' }, { who: `BS ${actor.name}`, text: 'gửi kiểm tồn', at: now() });
    if (p.replaces) {
      const old = await get<Protocol>(`/protocols/${p.replaces}`);
      if (isOpenProtocol(old)) await protocolsApi.supersede(old, p.id, actor);
    }
    await addAudit(actor, { action: 'SEND_STOCK_CHECK', label: 'Gửi kiểm tra tồn kho', object: `${p.id} · ${p.horse}`, area: 'med', from: 'DRAFT', to: 'WAITING_STOCK_CHECK' });
    return data;
  },

  async addItemsDuringTreatment(p: Protocol, adds: ItemAddition[], reason: string, actor: Actor) {
    if (p.state !== 'IN_TREATMENT') throw new Error('Chỉ bổ sung thuốc khi phác đồ đang điều trị.');
    const why = min(reason, 5, 'Lý do bổ sung thuốc');
    const data = await saveProtocol(p, { phases: withAddedItems(p.phases, adds) }, { who: `BS ${actor.name}`, text: `bổ sung ${adds.length} thuốc: ${why}`, at: now() });
    await addAudit(actor, { action: 'ADD_PROTOCOL_ITEMS', label: 'Bổ sung thuốc khi điều trị', object: `${p.id} · ${p.horse}`, area: 'med', to: `${adds.length} dòng`, reason: why });
    return data;
  },

  async cancelDraft(p: Protocol, actor: Actor, reason = '') {
    if (p.state === 'DRAFT') {
      const data = await saveProtocol(p, { ...goTo(p, 'CANCELLED'), note: 'Bản nháp đã hủy.' }, { who: `BS ${actor.name}`, text: 'hủy bản nháp', at: now() });
      await addAudit(actor, { action: 'CANCEL_PROTOCOL_DRAFT', label: 'Hủy phác đồ nháp', object: `${p.id} · ${p.horse}`, area: 'med', from: 'DRAFT', to: 'CANCELLED' });
      return data;
    }
    if (!ITEM_ADDABLE.includes(p.state)) throw new Error('Chỉ hủy được phác đồ chưa cấp thuốc.');
    const why = min(reason, 10, 'Lý do hủy phác đồ');
    await releaseHeld(p);
    const data = await saveProtocol(p, { ...goTo(p, 'CANCELLED'), note: `Hủy: ${why}` }, { who: `BS ${actor.name}`, text: `hủy phác đồ: ${why}`, at: now() });
    await addAudit(actor, { action: 'CANCEL_PROTOCOL', label: 'Hủy phác đồ', object: `${p.id} · ${p.horse}`, area: 'med', from: p.state, to: 'CANCELLED', reason: why });
    return data;
  },

  async supersede(old: Protocol, byId: string, actor: Actor) {
    await releaseHeld(old);
    await saveProtocol(old, { ...goTo(old, 'SUPERSEDED'), supersededBy: byId, note: `Đã bị thay bằng ${byId} — không cấp phát theo bản này.` },
      { who: `BS ${actor.name}`, text: `thay bằng ${byId}`, at: now() });
  },

  async waitRestock(p: Protocol, note: string, actor: Actor) {
    if (p.state !== 'REQUIRES_VET_REVIEW') throw new Error('Không thể chọn chờ hàng khi kho đã báo thiếu — hãy đổi thuốc bằng phiên bản mới.');
    const short = stockShort(p);
    if (!short.length) throw new Error('Kho không còn báo thiếu — xác nhận phác đồ thay vì chờ hàng.');
    const eta = lastEta(short);
    if (!eta) throw new Error('Kho chưa có ngày dự kiến hàng về — chưa thể chọn chờ.');
    const requiredBy = phaseRequiredBy(p, short.map((l) => l.itemId));
    const late = dateKey(eta) > dateKey(requiredBy);
    const why = note.trim();
    const data = await saveProtocol(p,
      { ...goTo(p, 'WAITING_RESTOCK'), wait: { eta, requiredBy, at: now(), note: why }, delayed: late,
        note: late ? `Chờ hàng về ${eta.slice(0, 5)} — trễ so với mốc cần thuốc ${requiredBy.slice(0, 5)}; BS đã đánh giá chờ vẫn an toàn.` : `Chờ hàng về ${eta.slice(0, 5)}, trước mốc cần thuốc ${requiredBy.slice(0, 5)}.` },
      { tone: 'warning', who: `BS ${actor.name}`, text: `chọn chờ hàng (ETA ${eta.slice(0, 5)})`, at: now() });
    await addAudit(actor, { action: 'WAIT_RESTOCK', label: 'Chờ nhập hàng', object: `${p.id} · ${p.horse}`, area: 'med', from: p.state, to: 'WAITING_RESTOCK', reason: why });
    return data;
  },

  async confirmProtocol(p: Protocol, note: string, actor: Actor) {
    if (!['STOCK_AVAILABLE', 'REQUIRES_VET_REVIEW', 'WAITING_RESTOCK'].includes(p.state)) throw new Error('Phác đồ chưa ở bước xác nhận.');
    if (!p.stock) throw new Error('Kho chưa phản hồi tồn.');
    const short = stockShort(p);
    if (short.length) throw new Error(`Còn thiếu ${short.map((l) => `${l.name} ${l.short} ${l.unit}`).join(', ')} — chỉ xác nhận khi kho đủ khả năng cấp.`);
    const horse = await get<Horse>(`/horses/${p.horseId}`);
    const why = note.trim();
    const data = await saveProtocol(p, { ...goTo(p, 'VET_CONFIRMED', 'READY_FOR_DISPENSING'), delayed: false, note: 'BS đã xác nhận — kho chuẩn bị cấp phát.' },
      { tone: 'success', who: `BS ${actor.name}`, text: 'xác nhận phác đồ, chuyển kho cấp phát', at: now() });
    await addAudit(actor, { action: 'CONFIRM_PROTOCOL', label: 'Xác nhận phác đồ', object: `${p.id} · ${horse.name}`, area: 'med', from: p.state, to: 'READY_FOR_DISPENSING', reason: why });
    return data;
  },

  async addProgress(p: Protocol, text: string, actor: Actor) {
    if (p.state !== 'IN_TREATMENT') throw new Error('Chỉ ghi tiến triển khi đang điều trị.');
    const entry = { at: now(), by: actor.name, text: text.trim() };
    const data = await saveProtocol(p, { progress: [entry, ...p.progress] });
    await addAudit(actor, { action: 'TREATMENT_PROGRESS', label: 'Ghi tiến triển điều trị', object: `${p.id} · ${p.horse}`, area: 'med', reason: entry.text });
    return data;
  },

  async startPhase(p: Protocol, phaseNo: number, actor: Actor) {
    const progress = phaseProgressOf(p);
    const current = progress.find((item) => !['COMPLETED', 'STOPPED'].includes(item.status));
    if (!p.phases.some((item) => item.no === phaseNo) || !current || current.phaseNo !== phaseNo) throw new Error('Chỉ được bắt đầu giai đoạn kế tiếp theo thứ tự.');
    if (!phaseIsPaid(p, phaseNo)) throw new Error(`Giai đoạn ${phaseNo} chưa được chủ ngựa thanh toán.`);
    if (!(p.dispensedPhases ?? []).includes(phaseNo)) throw new Error(`Giai đoạn ${phaseNo} chưa được kho cấp thuốc.`);
    const phaseProgress: PhaseProgress[] = progress.map((item) => item.phaseNo === phaseNo ? { ...item, status: 'IN_PROGRESS' } : item);
    return saveProtocol(p, { phaseProgress, note: `Bắt đầu giai đoạn ${phaseNo} sau khi đã thanh toán và nhận thuốc.` }, { tone: 'success', who: `BS ${actor.name}`, text: `bắt đầu giai đoạn ${phaseNo}`, at: now() });
  },

  async completePhase(p: Protocol, phaseNo: number, decision: 'CONTINUE' | 'STOP', reason: string, actor: Actor) {
    const progress = phaseProgressOf(p);
    const current = progress.find((item) => item.status === 'IN_PROGRESS');
    if (!current || current.phaseNo !== phaseNo) throw new Error('Chỉ được kết thúc giai đoạn đang điều trị.');
    if (!(p.dispensedPhases ?? []).includes(phaseNo)) throw new Error(`Giai đoạn ${phaseNo} chưa được kho cấp thuốc.`);
    if (!phaseIsPaid(p, phaseNo)) throw new Error(`Giai đoạn ${phaseNo} chưa được chủ ngựa thanh toán.`);
    const why = min(reason, 10, 'Lý do quyết định giai đoạn');
    const phaseProgress: PhaseProgress[] = progress.map((item) => item.phaseNo === phaseNo ? { ...item, status: decision === 'CONTINUE' ? 'COMPLETED' : 'STOPPED', reason: why } : item);
    const next = p.phases.find((item) => item.no > phaseNo && !phaseProgress.some((state) => state.phaseNo === item.no && ['COMPLETED', 'STOPPED'].includes(state.status)));
    const nextProgress = next && decision === 'CONTINUE' ? phaseProgress.map((item) => item.phaseNo === next.no ? { ...item, status: 'WAITING_PAYMENT' as const } : item) : phaseProgress;
    return saveProtocol(p, { phaseProgress: nextProgress, outcome: decision === 'STOP' ? `Ngưng sau giai đoạn ${phaseNo}: ${why}` : p.outcome, note: decision === 'CONTINUE' && next ? `Đã hoàn thành giai đoạn ${phaseNo}. Chủ ngựa cần thanh toán giai đoạn ${next.no} trước khi bắt đầu.` : `Đã ngưng sau giai đoạn ${phaseNo}: ${why}` }, { tone: decision === 'CONTINUE' ? 'success' : 'warning', who: `BS ${actor.name}`, text: decision === 'CONTINUE' ? `hoàn thành giai đoạn ${phaseNo}, tiếp tục điều trị` : `ngưng sau giai đoạn ${phaseNo}: ${why}`, at: now() });
  },

  async completeProtocol(p: Protocol, outcome: string, actor: Actor) {
    if (p.state !== 'IN_TREATMENT') throw new Error('Chỉ kết thúc khi phác đồ đang điều trị.');
    const why = outcome.trim();
    const data = await saveProtocol(p, { ...goTo(p, 'COMPLETED'), outcome: why, note: `Hoàn tất: ${why}` }, { tone: 'success', who: `BS ${actor.name}`, text: 'kết thúc điều trị', at: now() });
    const horse = await get<Horse>(`/horses/${p.horseId}`);
    await addHistory(horse, `Hoàn tất phác đồ ${p.id} — ${why}`, 'success');
    await addAudit(actor, { action: 'COMPLETE_PROTOCOL', label: 'Kết thúc điều trị', object: `${p.id} · ${p.horse}`, area: 'med', from: 'IN_TREATMENT', to: 'COMPLETED', reason: why });
    return data;
  },

};
