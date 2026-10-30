import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const source = process.argv[2] || 'dev';
const target = 'main';
const excluded = readFileSync('.github/main-exclude.txt', 'utf8').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const gitLoud = (...args) => execFileSync('git', args, { stdio: 'inherit' });
const tryGit = (...args) => {
  try {
    execFileSync('git', args, { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
};
const mergeInProgress = () => {
  try {
    git('rev-parse', '-q', '--verify', 'MERGE_HEAD');
    return true;
  } catch {
    return false;
  }
};
const stop = (message) => {
  console.error(`\n✖ ${message}`);
  process.exit(1);
};

if (git('status', '--porcelain')) stop('Còn thay đổi chưa commit. Commit hoặc cất (git stash) trước khi gộp.');

const startBranch = git('rev-parse', '--abbrev-ref', 'HEAD');
gitLoud('fetch', 'origin');

const behind = Number(git('rev-list', '--count', `${source}..origin/${source}`));
if (behind > 0) stop(`Nhánh ${source} ở máy đang thiếu ${behind} commit so với origin/${source}. Chạy: git switch ${source} && git pull --ff-only`);

gitLoud('switch', target);
if (!tryGit('pull', '--ff-only', 'origin', target)) stop(`Không cập nhật được ${target} từ origin (nhánh đã rẽ hướng). Kiểm tra lại rồi chạy lại.`);

const merged = tryGit('merge', '--no-ff', '--no-commit', source);
gitLoud('rm', '-r', '-q', '-f', '--ignore-unmatch', '--', ...excluded);

const conflicts = git('diff', '--name-only', '--diff-filter=U');
if (conflicts) {
  console.error(`\nXung đột cần xử lý tay:\n${conflicts}`);
  stop(`Sửa các file trên, git add, rồi git commit. Muốn hủy lần gộp: git merge --abort && git switch ${startBranch}`);
}
if (!merged && !git('diff', '--cached', '--name-only')) stop('Gộp thất bại mà không có thay đổi nào. Xem thông báo của git ở trên.');

const leftovers = git('ls-files', '--', ...excluded);
if (leftovers) stop(`Vẫn còn file nội bộ trên ${target}:\n${leftovers}`);

const staged = git('diff', '--cached', '--name-only');
if (staged || mergeInProgress()) {
  gitLoud('commit', '--no-edit', '-m', `Merge branch '${source}' into ${target}`);
} else {
  console.log(`\n${target} đã có đủ code của ${source}, không có gì để gộp.`);
}

gitLoud('switch', startBranch);
console.log(`\n✔ Đã gộp ${source} vào ${target} ở máy, bỏ ${excluded.length} mục nội bộ. Chưa push.`);
console.log(`Xem lại: git log --oneline -3 ${target}`);
console.log(`Đẩy lên: git push origin ${target}`);
