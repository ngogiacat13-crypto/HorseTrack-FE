"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MOCK_INVOICES = exports.MOCK_TASKS = exports.MOCK_HORSES = exports.authApi = exports.ROLE_HOME = exports.ROLE_LABELS = void 0;
exports.ROLE_LABELS = {
    ClubManager: 'Quản lý CLB',
    HeadTrainer: 'HLV trưởng',
    Veterinarian: 'Bác sĩ thú y',
    Groom: 'Nhân viên chăm ngựa',
    HorseOwner: 'Chủ ngựa',
    WarehouseManager: 'Quản lý kho',
};
exports.ROLE_HOME = {
    ClubManager: '/manager',
    HeadTrainer: '/trainer',
    Veterinarian: '/vet',
    Groom: '/groom',
    HorseOwner: '/owner',
    WarehouseManager: '/warehouse',
};
// --- Giả lập Database người dùng đã đăng ký ---
var MOCK_USERS = [
    {
        userId: '1', id: '1', username: 'nguyenminh', password: 'password123',
        fullname: 'Nguyễn Văn Minh', name: 'Nguyễn Văn Minh', avatar: 'M',
        email: 'minh@horsetrack.vn', phone: '0901234567',
        role: 'HorseOwner',
    },
    {
        userId: '2', id: '2', username: 'duchung', password: 'password123',
        fullname: 'Trần Đức Hùng', name: 'Trần Đức Hùng', avatar: 'H',
        email: 'hung@horsetrack.vn', phone: '0912345678',
        role: 'HeadTrainer',
    },
    {
        userId: '3', id: '3', username: 'thihuong', password: 'password123',
        fullname: 'Lê Thị Hương', name: 'Lê Thị Hương', avatar: 'L',
        email: 'huong@horsetrack.vn', phone: '0923456789',
        role: 'Veterinarian',
    },
    {
        userId: 'u1', id: 'u1', username: 'manager', password: 'password123',
        fullname: 'Nguyễn Văn Minh', name: 'Nguyễn Văn Minh', avatar: 'M',
        email: 'manager@horsetrack.vn', phone: '0901234560',
        role: 'ClubManager',
    },
    {
        userId: 'u4', id: 'u4', username: 'groom', password: 'password123',
        fullname: 'Phạm Văn Toàn', name: 'Phạm Văn Toàn', avatar: 'P',
        email: 'groom@horsetrack.vn', phone: '0901234561',
        role: 'Groom',
    },
    {
        userId: 'u6', id: 'u6', username: 'warehouse', password: 'password123',
        fullname: 'Bùi Quốc Khánh', name: 'Bùi Quốc Khánh', avatar: 'B',
        email: 'warehouse@horsetrack.vn', phone: '0901234562',
        role: 'WarehouseManager',
    }
];
// --- Hàm giả lập gọi API Backend ---
exports.authApi = {
    /**
     * Đăng nhập: backend tự nhận diện role dựa trên username
     */
    login: function (username, password) {
        return __awaiter(this, void 0, Promise, function () {
            var user, _pw, safeUser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 800); })];
                    case 1:
                        _a.sent();
                        user = MOCK_USERS.find(function (u) {
                            return (u.username === username || u.email === username || u.phone === username) &&
                                u.password === password;
                        });
                        if (!user)
                            throw new Error('Tên đăng nhập hoặc mật khẩu không đúng!');
                        _pw = user.password, safeUser = __rest(user, ["password"]);
                        return [2 /*return*/, safeUser];
                }
            });
        });
    },
    /**
     * Đăng ký: kiểm tra trùng email/phone, mặc định role là HorseOwner
     */
    register: function (payload) {
        return __awaiter(this, void 0, Promise, function () {
            var dupEmail, dupPhone, dupUsername, newUser, _pw, safeUser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 1000); })];
                    case 1:
                        _a.sent();
                        dupEmail = MOCK_USERS.find(function (u) { return u.email === payload.email; });
                        dupPhone = MOCK_USERS.find(function (u) { return u.phone === payload.phone; });
                        dupUsername = MOCK_USERS.find(function (u) { return u.username === payload.username; });
                        if (dupEmail)
                            throw { field: 'email', message: 'Email này đã được đăng ký.' };
                        if (dupPhone)
                            throw { field: 'phone', message: 'Số điện thoại này đã được đăng ký.' };
                        if (dupUsername)
                            throw { field: 'username', message: 'Tên đăng nhập đã tồn tại.' };
                        newUser = {
                            userId: String(MOCK_USERS.length + 1),
                            id: String(MOCK_USERS.length + 1),
                            username: payload.username,
                            password: payload.password,
                            fullname: payload.fullname,
                            name: payload.fullname,
                            email: payload.email,
                            phone: payload.phone,
                            role: 'HorseOwner',
                            avatar: payload.fullname.charAt(0).toUpperCase(),
                        };
                        MOCK_USERS.push(newUser);
                        _pw = newUser.password, safeUser = __rest(newUser, ["password"]);
                        return [2 /*return*/, safeUser];
                }
            });
        });
    },
    /**
     * Gửi OTP (giả lập)
     */
    sendOtp: function (contact) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 800); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Đặt lại mật khẩu bằng OTP
     */
    resetPassword: function (contact, otp, newPassword) {
        return __awaiter(this, void 0, Promise, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 1000); })];
                    case 1:
                        _a.sent();
                        if (otp !== '123456')
                            throw new Error('Mã OTP không đúng. Vui lòng thử lại với 123456.');
                        user = MOCK_USERS.find(function (u) { return u.email === contact || u.phone === contact; });
                        if (!user)
                            throw new Error('Không tìm thấy tài khoản.');
                        user.password = newPassword;
                        return [2 /*return*/];
                }
            });
        });
    },
    /**
     * Đổi mật khẩu khi đã đăng nhập
     */
    changePassword: function (userId, oldPassword, newPassword) {
        return __awaiter(this, void 0, Promise, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 1000); })];
                    case 1:
                        _a.sent();
                        user = MOCK_USERS.find(function (u) { return u.userId === userId; });
                        if (!user)
                            throw new Error('Không tìm thấy tài khoản.');
                        if (user.password !== oldPassword)
                            throw new Error('Mật khẩu hiện tại không đúng.');
                        user.password = newPassword;
                        return [2 /*return*/];
                }
            });
        });
    },
};
exports.MOCK_HORSES = [
    { id: 'h1', name: 'Galaxy', breed: 'Thoroughbred', age: '4 tuổi', gender: 'Đực', healthStatus: 'Healthy', isLocked: false, ownerName: 'Hoàng Thị Lan', trainerPlan: 'Sức bền - Giai đoạn 2' },
    { id: 'h2', name: 'Storm', breed: 'Arabian', age: '3 tuổi', gender: 'Cái', healthStatus: 'Injured', isLocked: true, ownerName: 'Đỗ Minh Quân' },
    { id: 'h3', name: 'Bolt', breed: 'Quarter Horse', age: '5 tuổi', gender: 'Đực', healthStatus: 'Healthy', isLocked: false, ownerName: 'Vũ Thị Mai', trainerPlan: 'Tốc độ - Giai đoạn 1' },
    { id: 'h4', name: 'Thunder', breed: 'Thoroughbred', age: '4 tuổi', gender: 'Đực', healthStatus: 'UnderObservation', isLocked: false, ownerName: 'Hoàng Thị Lan' },
];
exports.MOCK_TASKS = [
    { id: 't1', title: 'Cho ăn sáng', horseName: 'Galaxy', time: '06:00', status: 'Overdue', type: 'Feeding', description: '3kg cám + 2kg cỏ' },
    { id: 't2', title: 'Dọn chuồng', horseName: 'Storm', time: '07:00', status: 'Pending', type: 'MuckingOut', description: 'Vệ sinh toàn bộ chuồng A-03' },
    { id: 't3', title: 'Chải lông', horseName: 'Bolt', time: '06:30', status: 'Completed', type: 'Grooming', description: 'Chải lông và kiểm tra móng' },
];
exports.MOCK_INVOICES = [
    { id: 'INV-0042', horseName: 'Galaxy', amount: 15000000, dueDate: '10/09/2026', status: 'Overdue' },
    { id: 'INV-0043', horseName: 'Storm', amount: 6000000, dueDate: '15/10/2026', status: 'Pending' },
    { id: 'INV-0041', horseName: 'Bolt', amount: 12500000, dueDate: '01/09/2026', status: 'Paid' },
];
