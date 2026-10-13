# 나는 어떤 AI 유형?

28문항, 5분이면 끝나는 AI 사용 성향 테스트 (16유형). 서버 없이 동작하는 정적 웹사이트입니다.

## GitHub Pages로 배포하기
1. GitHub에서 새 저장소(Repository)를 만듭니다. (Public)
2. 이 폴더 안의 파일 전체(`index.html`, `assets/`, `README.md`)를 저장소 맨 위(루트)에 올립니다.
   - 웹에서: 저장소 화면의 `Add file` > `Upload files`에 폴더째 끌어다 놓고 `Commit changes`
3. 저장소의 `Settings` > `Pages`에서 Source를 `Deploy from a branch`, Branch를 `main` / `/ (root)`로 선택하고 Save.
4. 1~2분 뒤 `https://계정이름.github.io/저장소이름/` 주소가 생깁니다. 이 링크를 공유하면 됩니다.

## 배포 후 꼭 할 일 (링크 미리보기)
`index.html`의 `og:image`를 전체 주소로 바꿔 주세요. 그래야 카카오톡 등에 링크를 붙였을 때 이미지가 보입니다.
```html
<meta property="og:image" content="https://계정이름.github.io/저장소이름/assets/og.png">
```

## 문구 수정하기
- 문항과 16유형 설명: `assets/js/data.js`
- 색상과 디자인: `assets/css/style.css` (맨 위 `:root` 색상 변수)
- 캐릭터 파츠: `assets/js/mascot.js`
