import type { IconName } from '../../../components/ui/Icon';

export type Lang = 'vi' | 'en';

const unsplash = (id: string, w: number) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

export const PHOTOS = {
  hero: unsplash('photo-1495543377553-b2aba1f925d7', 2000),
  stable: unsplash('photo-1761245048235-8e089f329d29', 900),
  jockey: unsplash('photo-1516673699707-4f2a243fafaf', 900),
  gallery: [
    unsplash('photo-1758573951451-a6d625f124de', 600),
    unsplash('photo-1590839823121-c253bf8d1e7d', 600),
    unsplash('photo-1604429287879-6bc7a7572048', 600),
    unsplash('photo-1566392785474-926a4c6257b5', 600),
    unsplash('photo-1682636109270-93cb7b720716', 600),
    unsplash('photo-1635895901494-539a6b2647af', 600),
    unsplash('photo-1507514604110-ba3347c457f6', 600),
    unsplash('photo-1694446942933-bc29e37df9f3', 600),
  ],
};

export interface Service { id: string; icon: IconName; title: string; text: string; points: string[]; size: 'lg' | 'md' | 'sm' }
export interface Step { title: string; text: string }
export interface TeamTab { key: string; icon: IconName; name: string; headline: string; text: string; forYou: string[] }
export interface Faq { q: string; a: string }

export interface LandingContent {
  nav: { about: string; services: string; process: string; team: string; faq: string; login: string; register: string; langLabel: string };
  hero: { kicker: string; title: string; tagline: string[]; lead: string; primary: string; secondary: string; photoAlt: string };
  about: {
    left: { title: string; link: string; alt: string };
    middle: { stamp: string; title: string; text: string; button: string };
    right: { title: string; link: string; alt: string };
  };
  services: { kicker: string; title: string; lead: string; items: Service[]; chart: string };
  process: { kicker: string; title: string; lead: string; steps: Step[]; cta: string };
  team: { kicker: string; title: string; lead: string; tabs: TeamTab[]; forYouLabel: string };
  promises: { kicker: string; title: string; items: { quote: string; by: string }[]; prev: string; next: string };
  gallery: { kicker: string; title: string; captions: string[] };
  faq: { kicker: string; title: string; items: Faq[] };
  band: { title: string; text: string; register: string; login: string };
  footer: {
    details: string; detailLines: string[]; links: string; account: string;
    linkItems: { href: string; label: string }[]; login: string; register: string; forgot: string;
    status: { checking: string; ok: string; down: string; demo: string; label: string }; rights: string; photos: string;
  };
}

const vi: LandingContent = {
  nav: { about: 'Giới thiệu', services: 'Dịch vụ', process: 'Gửi ngựa', team: 'Đội ngũ', faq: 'Hỏi đáp', login: 'Đăng nhập', register: 'Đăng ký gửi ngựa', langLabel: 'Ngôn ngữ' },
  hero: {
    kicker: '— Câu lạc bộ huấn luyện ngựa đua —', title: 'HorseTrack',
    tagline: ['Huấn luyện bài bản', 'Chăm sóc tận tâm', 'Sẵn sàng thi đấu'],
    lead: 'Gửi ngựa cho đội ngũ huấn luyện viên, bác sĩ thú y và người chăm ngựa của câu lạc bộ — và theo dõi ngựa của bạn mỗi ngày ngay trên điện thoại.',
    primary: 'Đăng ký gửi ngựa', secondary: 'Xem dịch vụ', photoAlt: 'Ngựa đua và nài ngựa trên đường đua',
  },
  about: {
    left: { title: 'Về câu lạc bộ', link: 'Dịch vụ của chúng tôi', alt: 'Ngựa nhìn ra từ cửa chuồng gỗ' },
    middle: { stamp: 'An toàn · Minh bạch · Tận tâm · ', title: 'Đưa ngựa ra đường đua', text: 'Câu lạc bộ cập nhật các giải đấu phù hợp với ngựa của bạn. Huấn luyện viên đánh giá thể lực, bác sĩ khám trước thi đấu và câu lạc bộ lo hồ sơ đăng ký giải.', button: 'Tìm hiểu thêm' },
    right: { title: 'Đội ngũ chuyên môn', link: 'Gặp đội ngũ', alt: 'Nài ngựa cưỡi ngựa đua' },
  },
  services: {
    kicker: 'Dịch vụ', title: 'Mọi điều ngựa của bạn cần, ở một nơi',
    lead: 'Từ chỗ ở, bữa ăn, buổi tập đến những lần khám bệnh — câu lạc bộ chăm lo trọn vẹn để ngựa luôn khỏe và giữ phong độ.',
    chart: 'Buổi tập tự dừng khi nhịp tim vượt ngưỡng',
    items: [
      { id: 'service-training', icon: 'pulse', size: 'lg', title: 'Huấn luyện theo giáo án', text: 'Huấn luyện viên xây dựng giáo án riêng cho từng con ngựa theo từng giai đoạn. Mỗi buổi tập đều được theo dõi nhịp tim; nếu vượt ngưỡng an toàn, buổi tập dừng ngay để huấn luyện viên điều chỉnh.', points: ['Giáo án riêng cho từng ngựa', 'Theo dõi nhịp tim mỗi buổi', 'Đánh giá sau mỗi buổi tập', 'Nghỉ ngơi hợp lý trước ngày thi'] },
      { id: 'service-health', icon: 'heart', size: 'md', title: 'Thú y & điều trị', text: 'Bác sĩ thú y khám định kỳ, tiêm phòng, tẩy giun và điều trị theo phác đồ khi ngựa không khỏe.', points: ['Tiêm phòng đúng lịch', 'Điều trị theo phác đồ'] },
      { id: 'service-stable', icon: 'stable', size: 'md', title: 'Lưu chuồng & dinh dưỡng', text: 'Chuồng riêng theo khu, người chăm ngựa chăm sóc hằng ngày và thực đơn dinh dưỡng được bác sĩ duyệt.', points: ['Chăm sóc hằng ngày', 'Thực đơn dinh dưỡng'] },
      { id: 'service-race', icon: 'trend', size: 'sm', title: 'Tham gia giải đấu', text: 'Xem các giải phù hợp với ngựa của bạn và đề xuất tham gia; câu lạc bộ chuẩn bị hồ sơ đăng ký giải.', points: ['Gợi ý giải phù hợp'] },
      { id: 'service-app', icon: 'eye', size: 'sm', title: 'Theo dõi trực tuyến', text: 'Xem sức khỏe, buổi tập, kết quả thi và hóa đơn của ngựa bất cứ lúc nào; thanh toán qua VNPay.', points: ['Minh bạch chi phí'] },
    ],
  },
  process: {
    kicker: 'Gửi ngựa', title: 'Bắt đầu chỉ với bốn bước', lead: 'Đăng ký trực tuyến, câu lạc bộ xét duyệt hồ sơ và sắp xếp chuồng cho ngựa của bạn.',
    steps: [
      { title: 'Tạo tài khoản', text: 'Đăng ký tài khoản chủ ngựa bằng email, xác thực bằng mã OTP.' },
      { title: 'Gửi hồ sơ ngựa', text: 'Khai báo thông tin ngựa, đính kèm giấy tờ sở hữu và giấy chứng nhận sức khỏe.' },
      { title: 'Câu lạc bộ duyệt', text: 'Quản lý câu lạc bộ xem xét hồ sơ, xếp chuồng và giao huấn luyện viên phụ trách.' },
      { title: 'Theo dõi mỗi ngày', text: 'Xem buổi tập, sức khỏe, hóa đơn và đăng ký thi đấu ngay trên tài khoản của bạn.' },
    ],
    cta: 'Đăng ký ngay',
  },
  team: {
    kicker: 'Đội ngũ', title: 'Những người chăm lo cho ngựa của bạn', lead: 'Mỗi con ngựa có huấn luyện viên, bác sĩ và người chăm ngựa phụ trách rõ ràng.',
    forYouLabel: 'Điều bạn nhận được',
    tabs: [
      { key: 'trainer', icon: 'trend', name: 'Huấn luyện viên', headline: 'Giữ phong độ cho ngựa', text: 'Huấn luyện viên trưởng lên giáo án, xếp lịch tập và đánh giá tiến bộ của ngựa sau mỗi buổi.', forYou: ['Giáo án phù hợp thể trạng ngựa', 'Nhận xét sau mỗi buổi tập', 'Đánh giá sẵn sàng trước mỗi giải'] },
      { key: 'vet', icon: 'heart', name: 'Bác sĩ thú y', headline: 'Sức khỏe là trên hết', text: 'Bác sĩ thú y theo dõi sức khỏe, có quyền tạm dừng huấn luyện khi ngựa cần nghỉ ngơi hoặc điều trị.', forYou: ['Lịch tiêm phòng, tẩy giun', 'Điều trị theo phác đồ rõ ràng', 'Khám trước mỗi lần thi đấu'] },
      { key: 'groom', icon: 'task', name: 'Người chăm ngựa', headline: 'Chăm sóc mỗi ngày', text: 'Người chăm ngựa phụ trách từng khu chuồng: cho ăn, vệ sinh, dắt ngựa đi tập và báo ngay khi có sự cố.', forYou: ['Chăm sóc đúng giờ', 'Thực đơn theo chỉ định', 'Báo cáo sự cố kịp thời'] },
      { key: 'manager', icon: 'shield', name: 'Quản lý câu lạc bộ', headline: 'Người đồng hành của bạn', text: 'Quản lý câu lạc bộ duyệt hồ sơ, sắp xếp chuồng, lo hồ sơ thi đấu và giải đáp mọi thắc mắc của chủ ngựa.', forYou: ['Xét duyệt hồ sơ nhanh chóng', 'Hồ sơ đăng ký giải đấu', 'Hóa đơn rõ ràng theo kỳ'] },
    ],
  },
  promises: {
    kicker: 'Cam kết', title: 'An toàn cho ngựa của bạn', prev: 'Cam kết trước', next: 'Cam kết sau',
    items: [
      { quote: 'Ngựa đang được bác sĩ yêu cầu nghỉ sẽ không bị đưa vào tập luyện hay thi đấu, cho đến khi bác sĩ cho phép.', by: 'Sức khỏe trước tiên' },
      { quote: 'Mỗi buổi tập đều được theo dõi nhịp tim. Vượt ngưỡng an toàn là dừng ngay để huấn luyện viên điều chỉnh.', by: 'Tập luyện an toàn' },
      { quote: 'Ngựa không tập cường độ cao trong 7 ngày trước ngày thi đấu, để vào giải với thể trạng tốt nhất.', by: 'Nghỉ ngơi trước giải' },
      { quote: 'Mọi chi phí đều có hóa đơn rõ ràng; thanh toán qua VNPay và chỉ được ghi nhận khi giao dịch được xác minh.', by: 'Minh bạch chi phí' },
    ],
  },
  gallery: { kicker: 'Đời sống câu lạc bộ', title: 'Một ngày ở chuồng ngựa', captions: ['Huấn luyện', 'Chăm sóc', 'Sức khỏe', 'Chuồng ngựa', 'Yên cương', 'Tập trên cỏ', 'Kỹ thuật', 'Ngày thi đấu'] },
  faq: {
    kicker: 'Hỏi đáp', title: 'Câu hỏi thường gặp',
    items: [
      { q: 'Ai có thể gửi ngựa tại câu lạc bộ?', a: 'Bất kỳ chủ ngựa nào có giấy tờ sở hữu hợp lệ. Bạn tạo tài khoản, gửi hồ sơ ngựa và chờ câu lạc bộ xét duyệt.' },
      { q: 'Tôi cần chuẩn bị giấy tờ gì?', a: 'Giấy tờ chứng minh quyền sở hữu và giấy chứng nhận sức khỏe của ngựa, cùng thông tin cơ bản như giống, tuổi, màu lông, chiều cao, cân nặng.' },
      { q: 'Chi phí được tính và thanh toán thế nào?', a: 'Phí huấn luyện và lưu chuồng tính theo kỳ; chi phí điều trị tính theo từng giai đoạn của phác đồ. Bạn xem hóa đơn và thanh toán qua VNPay ngay trên tài khoản.' },
      { q: 'Nếu ngựa bị ốm hoặc chấn thương thì sao?', a: 'Bác sĩ thú y sẽ khám, tạm dừng huấn luyện nếu cần và điều trị theo phác đồ. Bạn theo dõi được từng giai đoạn điều trị trên tài khoản.' },
      { q: 'Ngựa của tôi có được tham gia giải đấu không?', a: 'Có. Hệ thống cho biết giải nào phù hợp với ngựa của bạn; sau khi huấn luyện viên xác nhận, bác sĩ khám đạt và bạn nộp lệ phí, câu lạc bộ hoàn tất hồ sơ đăng ký.' },
      { q: 'Tôi theo dõi ngựa của mình bằng cách nào?', a: 'Đăng nhập tài khoản chủ ngựa trên máy tính hoặc điện thoại để xem sức khỏe, lịch tập, kết quả thi và hóa đơn.' },
    ],
  },
  band: { title: 'Sẵn sàng gửi ngựa?', text: 'Tạo tài khoản và gửi hồ sơ ngựa — câu lạc bộ sẽ liên hệ khi hồ sơ được duyệt.', register: 'Đăng ký gửi ngựa', login: 'Đã có tài khoản' },
  footer: {
    details: 'Câu lạc bộ', detailLines: ['Câu lạc bộ huấn luyện ngựa đua HorseTrack', 'Huấn luyện · Chăm sóc · Thú y · Thi đấu', 'Hỗ trợ: liên hệ Quản lý câu lạc bộ'],
    links: 'Khám phá', account: 'Tài khoản',
    linkItems: [{ href: '#services', label: 'Dịch vụ' }, { href: '#process', label: 'Gửi ngựa' }, { href: '#team', label: 'Đội ngũ' }, { href: '#faq', label: 'Hỏi đáp' }],
    login: 'Đăng nhập', register: 'Đăng ký chủ ngựa', forgot: 'Quên mật khẩu',
    status: { label: 'Trạng thái hệ thống', checking: 'Đang kiểm tra máy chủ…', ok: 'Hoạt động bình thường', down: 'Không kết nối được máy chủ', demo: 'Đang chạy dữ liệu mẫu' },
    rights: 'HorseTrack', photos: 'Ảnh: Unsplash',
  },
};

const en: LandingContent = {
  nav: { about: 'About', services: 'Services', process: 'Get started', team: 'Team', faq: 'FAQ', login: 'Sign in', register: 'Board your horse', langLabel: 'Language' },
  hero: {
    kicker: '— Racehorse training club —', title: 'HorseTrack',
    tagline: ['Structured training', 'Dedicated care', 'Race ready'],
    lead: 'Board your horse with the club’s trainers, vets and grooms — and follow your horse every day from your phone.',
    primary: 'Board your horse', secondary: 'Our services', photoAlt: 'Racehorses and jockeys on the track',
  },
  about: {
    left: { title: 'About the club', link: 'Our services', alt: 'Horse looking out of a wooden stable door' },
    middle: { stamp: 'Safe · Transparent · Caring · ', title: 'To the racetrack', text: 'The club lists races that suit your horse. Trainers assess fitness, vets examine before the race and the club prepares the entry dossier.', button: 'Learn more' },
    right: { title: 'Expert team', link: 'Meet the team', alt: 'Jockey riding a racehorse' },
  },
  services: {
    kicker: 'Services', title: 'Everything your horse needs, in one place',
    lead: 'Stabling, feeding, training and veterinary care — the club looks after it all so your horse stays healthy and in form.',
    chart: 'Sessions stop when heart rate crosses the limit',
    items: [
      { id: 'service-training', icon: 'pulse', size: 'lg', title: 'Planned training', text: 'Trainers build a phased plan for every horse. Each session is heart-rate monitored; if it crosses the safe limit the session stops so the trainer can adjust.', points: ['A plan for each horse', 'Heart rate every session', 'Feedback after each session', 'Proper rest before race day'] },
      { id: 'service-health', icon: 'heart', size: 'md', title: 'Veterinary care', text: 'Regular check-ups, vaccination, deworming and protocol-based treatment when your horse is unwell.', points: ['Vaccinations on schedule', 'Clear treatment plans'] },
      { id: 'service-stable', icon: 'stable', size: 'md', title: 'Stabling & nutrition', text: 'Stalls by zone, daily grooming and a vet-approved diet.', points: ['Daily care', 'Nutrition plans'] },
      { id: 'service-race', icon: 'trend', size: 'sm', title: 'Race entries', text: 'See races that suit your horse and propose an entry; the club prepares the dossier.', points: ['Suitable races suggested'] },
      { id: 'service-app', icon: 'eye', size: 'sm', title: 'Follow online', text: 'Health, sessions, results and invoices anytime; pay with VNPay.', points: ['Transparent costs'] },
    ],
  },
  process: {
    kicker: 'Get started', title: 'Four simple steps', lead: 'Apply online; the club reviews your horse and arranges a stall.',
    steps: [
      { title: 'Create an account', text: 'Sign up as an owner with your email and confirm with an OTP code.' },
      { title: 'Submit your horse', text: 'Enter your horse’s details with ownership and health documents.' },
      { title: 'Club approval', text: 'The club manager reviews, assigns a stall and a responsible trainer.' },
      { title: 'Follow every day', text: 'See sessions, health, invoices and race entries in your account.' },
    ],
    cta: 'Sign up now',
  },
  team: {
    kicker: 'Team', title: 'The people caring for your horse', lead: 'Every horse has a named trainer, vet and groom.',
    forYouLabel: 'What you get',
    tabs: [
      { key: 'trainer', icon: 'trend', name: 'Trainer', headline: 'Keeping your horse in form', text: 'The head trainer plans training, schedules sessions and reviews progress after each one.', forYou: ['A plan that fits your horse', 'Feedback after every session', 'Readiness check before each race'] },
      { key: 'vet', icon: 'heart', name: 'Veterinarian', headline: 'Health comes first', text: 'The vet monitors health and can pause training whenever your horse needs rest or treatment.', forYou: ['Vaccination & deworming schedule', 'Clear treatment protocols', 'Exam before every race'] },
      { key: 'groom', icon: 'task', name: 'Groom', headline: 'Care every day', text: 'Grooms look after each stable zone: feeding, cleaning, leading horses to training and reporting incidents.', forYou: ['Care on schedule', 'Diet as prescribed', 'Prompt incident reports'] },
      { key: 'manager', icon: 'shield', name: 'Club manager', headline: 'Your point of contact', text: 'The club manager approves horses, arranges stalls, handles race dossiers and answers owners’ questions.', forYou: ['Quick application review', 'Race entry dossiers', 'Clear periodic invoices'] },
    ],
  },
  promises: {
    kicker: 'Our promise', title: 'Safety for your horse', prev: 'Previous', next: 'Next',
    items: [
      { quote: 'A horse the vet has told to rest is never put into training or a race until the vet allows it.', by: 'Health first' },
      { quote: 'Every session is heart-rate monitored. Crossing the safe limit stops the session for the trainer to adjust.', by: 'Safe training' },
      { quote: 'No high-intensity work in the 7 days before a race, so your horse arrives in top condition.', by: 'Rest before racing' },
      { quote: 'Every cost comes with a clear invoice; VNPay payments are recorded only once verified.', by: 'Transparent costs' },
    ],
  },
  gallery: { kicker: 'Club life', title: 'A day at the stable', captions: ['Training', 'Care', 'Health', 'Stables', 'Tack', 'Grass work', 'Technique', 'Race day'] },
  faq: {
    kicker: 'FAQ', title: 'Frequently asked questions',
    items: [
      { q: 'Who can board a horse at the club?', a: 'Any owner with valid ownership papers. Create an account, submit your horse and wait for the club’s review.' },
      { q: 'Which documents do I need?', a: 'Proof of ownership and a health certificate, plus basics such as breed, age, colour, height and weight.' },
      { q: 'How are costs billed and paid?', a: 'Training and stabling are billed per period; treatment is billed per protocol phase. View and pay invoices with VNPay in your account.' },
      { q: 'What if my horse gets sick or injured?', a: 'The vet examines it, pauses training if needed and treats it under a protocol you can follow phase by phase.' },
      { q: 'Can my horse enter races?', a: 'Yes. The system shows suitable races; once the trainer confirms, the vet passes the exam and you pay the fee, the club completes the entry.' },
      { q: 'How do I follow my horse?', a: 'Sign in to your owner account on a computer or phone to see health, training, race results and invoices.' },
    ],
  },
  band: { title: 'Ready to board your horse?', text: 'Create an account and submit your horse — the club will contact you once it is approved.', register: 'Board your horse', login: 'I have an account' },
  footer: {
    details: 'The club', detailLines: ['HorseTrack racehorse training club', 'Training · Care · Veterinary · Racing', 'Help: contact the club manager'],
    links: 'Explore', account: 'Account',
    linkItems: [{ href: '#services', label: 'Services' }, { href: '#process', label: 'Get started' }, { href: '#team', label: 'Team' }, { href: '#faq', label: 'FAQ' }],
    login: 'Sign in', register: 'Owner sign-up', forgot: 'Forgot password',
    status: { label: 'System status', checking: 'Checking server…', ok: 'All systems operational', down: 'Server unreachable', demo: 'Running on sample data' },
    rights: 'HorseTrack', photos: 'Photos: Unsplash',
  },
};

export const CONTENT: Record<Lang, LandingContent> = { vi, en };
