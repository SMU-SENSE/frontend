'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ElementType } from 'react'

interface MoveButtonProps {
  text: string;
  icon?: ElementType;
  href: string;
  /** 카테고리 색. 버튼 배경에 쓰임 */
  color?: string;
}

/* ───────────── 색 계산 ─────────────
 * 연한 색(#FFFBEC)에서 같은 계열의 진한 색을 만들어냄.
 * CSS 의 hsl(from ...) 문법은 브라우저가 못 읽으면 흰색이 되어버려서
 * 여기서 직접 계산함.
 * ------------------------------------ */

/** '#FFFBEC' → { h: 44, s: 100, l: 96 } */
const hexToHsl = (hex: string): { h: number; s: number; l: number } | null => {
  const clean = hex.replace('#', '').trim();

  // 3자리(#FFF)도 6자리로 늘려서 처리
  const full =
    clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean;

  if (full.length !== 6) return null;

  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  if ([r, g, b].some((v) => Number.isNaN(v))) return null;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (diff !== 0) {
    s = diff / (1 - Math.abs(2 * l - 1));

    if (max === r) h = ((g - b) / diff) % 6;
    else if (max === g) h = (b - r) / diff + 2;
    else h = (r - g) / diff + 4;

    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s: s * 100, l: l * 100 };
};

/**
 * 원래 색을 더 선명하고 어둡게 만듦.
 * saturate: 선명함 배수 / darken: 낮출 밝기(%)
 */
const toStrongColor = (
  hex: string,
  saturate = 4,
  darken = 22
): string => {
  const hsl = hexToHsl(hex);

  // 색을 못 읽으면 원래 색 그대로 (흰색으로 튀지 않게)
  if (!hsl) return hex;

  const s = Math.min(100, hsl.s * saturate);
  const l = Math.max(0, hsl.l - darken);

  return `hsl(${Math.round(hsl.h)} ${Math.round(s)}% ${Math.round(l)}%)`;
};

/* ───────────── 컴포넌트 ───────────── */

export default function MoveButton({
  text,
  href,
  icon: Icon,
  color = '#F0F0F4',
}: MoveButtonProps) {
  const pathname = usePathname();
  const isCurrentPage = pathname === href;

  return (
    <Link
      href={href}
      className="leftbar-design"
      // 지금 보고 있는 카테고리면 data-active="true"
      data-active={isCurrentPage ? 'true' : 'false'}
      style={
        {
          // 평소 색
          '--cat-color': color,
          // 눌렀을 때(지금 보고 있을 때) 색 — 미리 계산해서 넘김
          '--cat-active': toStrongColor(color),
          '--cat-active-border': toStrongColor(color, 4, 30),
        } as React.CSSProperties
      }
    >
      {Icon && <Icon size={28} />}
      <span>{text}</span>
    </Link>
  );
}