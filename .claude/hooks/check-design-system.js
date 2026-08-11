#!/usr/bin/env node
/**
 * PreToolUse hook — Write|Edit
 *
 * src/ 아래 .tsx / .css 파일에 새로 추가되는(=diff에서 +로 나오는) 내용만 검사해서
 * docs/design-system/*.md의 DON'T 규칙(하드엣지, 노섀도우, 제한된 트랜지션, 장식 폰트 금지,
 * 이모지 금지)을 위반하면 도구 실행 자체를 막는다. 기존에 이미 코드베이스에 있던 위반은
 * (아직 마이그레이션 전이므로) 건드리지 않는다 — 오직 이번 편집으로 "새로" 들어오는 내용만 본다.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function allow() {
  process.exit(0);
}

function deny(violations) {
  const lines = violations.map((v) => `- ${v.message} → ${v.doc} 참고`);
  const reason =
    `design-system 규칙 위반으로 편집이 차단되었습니다:\n${lines.join('\n')}\n\n` +
    `자세한 내용은 .claude/skills/design-system/SKILL.md 를 참고하세요.`;

  const output = {
    systemMessage: reason,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  };
  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}

function getAddedLinesForWrite(filePath, proposedContent) {
  if (!fs.existsSync(filePath)) {
    // 신규 파일 - 전체가 신규이므로 전체를 검사 대상으로 삼는다.
    return proposedContent;
  }
  const tmpFile = path.join(os.tmpdir(), `design-system-check-${process.pid}.tmp`);
  fs.writeFileSync(tmpFile, proposedContent);
  let diffOutput = '';
  try {
    diffOutput = execFileSync('diff', [filePath, tmpFile], { encoding: 'utf8' });
  } catch (e) {
    if (e.status === 1) {
      diffOutput = e.stdout || '';
    } else {
      // diff 자체가 실패한 경우(파일 접근 불가 등) - 검사를 건너뛰고 허용한다.
      diffOutput = '';
    }
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
  return diffOutput
    .split('\n')
    .filter((line) => line.startsWith('> '))
    .map((line) => line.slice(2))
    .join('\n');
}

function main() {
  const raw = readStdin();
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return allow();
  }

  const toolName = payload.tool_name;
  const filePath = payload.tool_input && payload.tool_input.file_path;

  if (!filePath || !/\/src\/.*\.(tsx|css)$/.test(filePath)) {
    return allow();
  }

  let content = '';
  if (toolName === 'Edit') {
    content = payload.tool_input.new_string || '';
  } else if (toolName === 'Write') {
    content = getAddedLinesForWrite(filePath, payload.tool_input.content || '');
  } else {
    return allow();
  }

  const violations = [];

  const roundedMatches = (content.match(/\brounded(-[a-zA-Z0-9]+)?\b/g) || []).filter(
    (m) => m !== 'rounded-none',
  );
  if (roundedMatches.length > 0) {
    violations.push({
      message: `라운드 클래스 사용 (${[...new Set(roundedMatches)].join(', ')}) — 하드엣지(radius 0) 원칙 위반`,
      doc: 'docs/design-system/borders-shadows.md',
    });
  }

  const shadowMatches = (content.match(/\bshadow(-[^\s"'`]+)?\b/g) || []).filter(
    (m) => m !== 'shadow-none',
  );
  if (shadowMatches.length > 0) {
    violations.push({
      message: `섀도우 클래스 사용 (${[...new Set(shadowMatches)].join(', ')}) — 섀도우 금지 원칙 위반`,
      doc: 'docs/design-system/borders-shadows.md',
    });
  }

  if (/\btransition-all\b/.test(content)) {
    violations.push({
      message: 'transition-all 사용 — opacity/border-color 외 속성은 트랜지션하지 않음',
      doc: 'docs/design-system/motion.md',
    });
  }

  if (/boogaloo/i.test(content)) {
    violations.push({
      message: 'Boogaloo(장식적 display 폰트) 사용 — 단일 모노스페이스 서체 원칙 위반',
      doc: 'docs/design-system/typography.md',
    });
  }

  if (/\p{Extended_Pictographic}/u.test(content)) {
    violations.push({
      message: '이모지 사용 — 담백하고 사무적인 콘텐츠 보이스 원칙 위반',
      doc: 'docs/design-system/content-voice.md',
    });
  }

  if (violations.length > 0) {
    return deny(violations);
  }
  return allow();
}

main();
