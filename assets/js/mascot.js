/*
 * 마스코트 SVG 생성기.
 * 몸체 하나에 축별 파츠를 끼워서 16유형 캐릭터를 만듭니다.
 *   축1 머리: E 탐험 모자 / D 설계도와 연필
 *   축2 손  : T 스패너     / P 하트와 손 흔들기
 *   축3 눈  : V 돋보기 눈  / G 반짝이는 눈
 *   축4 소품: W 체크리스트와 톱니 / C 팔레트와 별
 */
(function () {
  'use strict';

  var INK = '#1F1B2E';
  var COLOR = {
    E: '#6C5CE7', D: '#6C5CE7',
    T: '#FF6FA5', P: '#FF6FA5',
    V: '#2DD4BF', G: '#2DD4BF',
    W: '#FF9F43', C: '#FF9F43',
    Y: '#FFD84D'
  };
  // 배경 원 색: [축1][축4]
  var BLOB = {
    E: { W: '#E4DEFF', C: '#FFE0EE' },
    D: { W: '#D6F7F0', C: '#FFEFC9' }
  };

  function star(cx, cy, r, fill) {
    return '<path d="M' + cx + ' ' + (cy - r) + 'Q' + cx + ' ' + cy + ' ' + (cx + r) + ' ' + cy +
      'Q' + cx + ' ' + cy + ' ' + cx + ' ' + (cy + r) +
      'Q' + cx + ' ' + cy + ' ' + (cx - r) + ' ' + cy +
      'Q' + cx + ' ' + cy + ' ' + cx + ' ' + (cy - r) + 'Z" fill="' + fill + '"/>';
  }

  function props(d, blob) {
    var s = '';
    if (d === 'W') {
      // 체크리스트 카드
      s += '<g transform="translate(8 14) rotate(-8)">' +
        '<rect width="46" height="58" rx="6" fill="#fff" stroke="' + INK + '" stroke-width="4"/>';
      for (var i = 0; i < 3; i++) {
        var y = 16 + i * 14;
        s += '<path d="M9 ' + y + 'l4 4 l8 -9" fill="none" stroke="' + COLOR.W + '" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<path d="M26 ' + y + 'h12" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>';
      }
      s += '</g>';
      // 톱니
      s += '<circle cx="196" cy="24" r="14" fill="none" stroke="' + INK + '" stroke-width="5" stroke-dasharray="4.5 4.5"/>' +
        '<circle cx="196" cy="24" r="10" fill="' + COLOR.Y + '" stroke="' + INK + '" stroke-width="3"/>' +
        '<circle cx="196" cy="24" r="3.5" fill="' + blob + '"/>';
    } else {
      // 팔레트
      s += '<g transform="rotate(-10 34 40)">' +
        '<ellipse cx="34" cy="40" rx="28" ry="22" fill="' + COLOR.C + '" stroke="' + INK + '" stroke-width="4"/>' +
        '<circle cx="22" cy="36" r="5.5" fill="' + COLOR.P + '" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="34" cy="27" r="5.5" fill="' + COLOR.V + '" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="47" cy="35" r="5.5" fill="' + COLOR.Y + '" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="42" cy="50" r="4.5" fill="' + blob + '" stroke="' + INK + '" stroke-width="2"/>' +
        '</g>';
      s += star(194, 24, 11, COLOR.Y) + star(18, 108, 8, COLOR.P) + star(204, 112, 6, COLOR.V);
    }
    return s;
  }

  function arms(b, blob) {
    var s = '';
    // 왼팔(공통)
    s += '<path d="M52 124 Q28 132 30 158" fill="none" stroke="' + INK + '" stroke-width="8" stroke-linecap="round"/>';
    if (b === 'T') {
      s += '<path d="M168 124 Q192 132 190 158" fill="none" stroke="' + INK + '" stroke-width="8" stroke-linecap="round"/>';
    } else {
      s += '<path d="M168 120 Q206 116 205 86" fill="none" stroke="' + INK + '" stroke-width="8" stroke-linecap="round"/>';
    }
    return s;
  }

  function hands(b, blob) {
    var s = '<circle cx="30" cy="160" r="9" fill="#fff" stroke="' + INK + '" stroke-width="4"/>';
    if (b === 'T') {
      // 스패너
      s += '<g transform="translate(192 158) rotate(-4)">' +
        '<rect x="-4.5" y="-46" width="9" height="50" rx="3.5" fill="' + COLOR.T + '" stroke="' + INK + '" stroke-width="3"/>' +
        '<circle cx="0" cy="-48" r="11" fill="' + COLOR.T + '" stroke="' + INK + '" stroke-width="3"/>' +
        '<rect x="-4" y="-64" width="8" height="12" fill="' + blob + '"/>' +
        '</g>';
      s += '<circle cx="190" cy="160" r="9" fill="#fff" stroke="' + INK + '" stroke-width="4"/>';
    } else {
      s += '<circle cx="205" cy="82" r="9" fill="#fff" stroke="' + INK + '" stroke-width="4"/>';
      s += '<path d="M0 9C-19 -4 -10 -19 0 -9C10 -19 19 -4 0 9Z" transform="translate(205 56)" fill="' + COLOR.P + '" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>';
    }
    return s;
  }

  function face(c) {
    var s = '<rect x="63" y="100" width="94" height="58" rx="22" fill="' + INK + '"/>';
    // 볼터치
    s += '<circle cx="74" cy="143" r="5" fill="' + COLOR.P + '" opacity=".7"/><circle cx="146" cy="143" r="5" fill="' + COLOR.P + '" opacity=".7"/>';
    if (c === 'G') {
      s += star(92, 126, 12, COLOR.Y) + star(128, 126, 12, COLOR.Y);
      s += '<path d="M99 142 Q110 156 121 142" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>';
    } else {
      s += '<circle cx="92" cy="127" r="8.5" fill="#fff"/><circle cx="94" cy="128" r="3.8" fill="' + INK + '"/>';
      s += '<circle cx="128" cy="127" r="8.5" fill="#fff"/><circle cx="130" cy="128" r="3.8" fill="' + INK + '"/>';
      // 돋보기
      s += '<circle cx="128" cy="127" r="16" fill="#ffffff" fill-opacity=".14" stroke="' + COLOR.V + '" stroke-width="5"/>';
      s += '<path d="M140 139 L152 151" stroke="' + COLOR.V + '" stroke-width="7" stroke-linecap="round"/>';
      s += '<path d="M101 147 H119" stroke="#fff" stroke-width="4" stroke-linecap="round"/>';
    }
    return s;
  }

  function head(a) {
    if (a === 'E') {
      return '<path d="M72 78 Q72 38 110 38 Q148 38 148 78 Z" fill="' + COLOR.Y + '" stroke="' + INK + '" stroke-width="4.5" stroke-linejoin="round"/>' +
        '<path d="M73 68 H147 L148 78 H72 Z" fill="' + COLOR.E + '" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>' +
        '<ellipse cx="110" cy="79" rx="54" ry="9.5" fill="' + COLOR.Y + '" stroke="' + INK + '" stroke-width="4.5"/>';
    }
    // 설계도와 연필
    var g = '<g transform="rotate(-6 110 52)">' +
      '<rect x="78" y="30" width="64" height="42" rx="5" fill="#8E82F0" stroke="' + INK + '" stroke-width="4"/>';
    [94, 110, 126].forEach(function (x) { g += '<path d="M' + x + ' 34V68" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>'; });
    [44, 58].forEach(function (y) { g += '<path d="M82 ' + y + 'H138" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>'; });
    g += '</g>';
    g += '<path d="M150 74 L174 36" stroke="' + INK + '" stroke-width="11" stroke-linecap="round"/>' +
      '<path d="M150 74 L174 36" stroke="' + COLOR.Y + '" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M146 81 L150 74" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>';
    return g;
  }

  window.mascotSVG = function (code) {
    var a = code.charAt(0), b = code.charAt(1), c = code.charAt(2), d = code.charAt(3);
    var blob = BLOB[a][d];
    var s = '<svg class="mascot" viewBox="0 0 220 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="AI 마스코트 ' + code + '">';
    s += '<circle cx="110" cy="128" r="102" fill="' + blob + '"/>';
    s += props(d, blob);
    // 발
    s += '<ellipse cx="85" cy="201" rx="17" ry="8" fill="' + COLOR.E + '" stroke="' + INK + '" stroke-width="4"/>' +
         '<ellipse cx="135" cy="201" rx="17" ry="8" fill="' + COLOR.E + '" stroke="' + INK + '" stroke-width="4"/>';
    s += arms(b, blob);
    // 몸체 + 그림자
    s += '<rect x="45" y="81" width="130" height="115" rx="42" fill="' + INK + '"/>';
    s += '<rect x="45" y="75" width="130" height="115" rx="42" fill="#fff" stroke="' + INK + '" stroke-width="5"/>';
    s += face(c);
    // 배 쪽 4축 배지
    [COLOR[a], COLOR[b], COLOR[c], COLOR[d]].forEach(function (col, i) {
      s += '<circle cx="' + (80 + i * 20) + '" cy="174" r="6" fill="' + col + '" stroke="' + INK + '" stroke-width="2.5"/>';
    });
    s += hands(b, blob);
    s += head(a);
    s += '</svg>';
    return s;
  };
})();
