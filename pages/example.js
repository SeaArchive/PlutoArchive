const form = document.getElementById('addressForm');
const input = document.getElementById('addressInput');
const frame = document.getElementById('webFrame');
const statusText = document.getElementById('viewerStatus');
const startPanel = document.getElementById('viewerStart');
const resetButton = document.getElementById('resetButton');
const externalButton = document.getElementById('externalButton');

let activeUrl = '';

function normalizeUrl(rawValue) {
  const value = rawValue.trim();
  if (!value) throw new Error('주소를 입력하세요.');

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)
    ? value
    : `https://${value}`;

  const parsed = new URL(withProtocol);

  if (parsed.protocol !== 'https:') {
    throw new Error('GitHub Pages 내부 임베드는 HTTPS 주소만 사용할 수 있습니다.');
  }

  return parsed.href;
}

function updateExternalLink(url = '') {
  activeUrl = url;

  if (!url) {
    externalButton.href = '#';
    externalButton.classList.add('disabled');
    externalButton.setAttribute('aria-disabled', 'true');
    return;
  }

  externalButton.href = url;
  externalButton.classList.remove('disabled');
  externalButton.setAttribute('aria-disabled', 'false');
}

function resetViewer() {
  activeUrl = '';
  frame.removeAttribute('src');
  frame.classList.remove('active');
  startPanel.classList.remove('hidden');
  statusText.textContent = 'READY / URL을 입력하면 Pluto Archive 내부에서 사이트를 불러옵니다.';
  updateExternalLink();
  history.replaceState(null, '', location.pathname);
}

function loadSite(rawValue) {
  let url;

  try {
    url = normalizeUrl(rawValue);
  } catch (error) {
    statusText.textContent = `ERROR / ${error.message}`;
    return;
  }

  input.value = url;
  statusText.textContent = 'CONNECTING / 외부 노드 응답을 기다리는 중...';
  startPanel.classList.add('hidden');
  frame.classList.remove('active');
  updateExternalLink(url);

  frame.src = url;

  const query = new URLSearchParams();
  query.set('url', url);
  history.replaceState(null, '', `${location.pathname}?${query.toString()}`);
}

form.addEventListener('submit', event => {
  event.preventDefault();
  loadSite(input.value);
});

resetButton.addEventListener('click', resetViewer);

frame.addEventListener('load', () => {
  if (!activeUrl) return;
  frame.classList.add('active');
  statusText.textContent = 'CONNECTED / 표시되지 않는 사이트는 iframe 접근을 차단한 경우입니다.';
});

const initialUrl = new URLSearchParams(location.search).get('url');
if (initialUrl) {
  input.value = initialUrl;
  loadSite(initialUrl);
}
