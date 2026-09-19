import { supabase } from "./supabase-client.js";
import { getOwnerSession, signOutOwner } from "./admin-auth.js";

const BUCKET = "gallery";
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif"
]);
const DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});
const publicUrlCache = new Map();

const grid = document.getElementById("galleryGrid");
const itemCount = document.getElementById("itemCount");
const ownerZone = document.getElementById("ownerZone");
const uploadDialog = document.getElementById("uploadDialog");
const uploadForm = document.getElementById("uploadForm");
const uploadCloseButton = document.getElementById("uploadCloseButton");
const titleInput = document.getElementById("galleryTitle");
const descriptionInput = document.getElementById("galleryDescription");
const fileInput = document.getElementById("galleryImage");
const fileDrop = document.getElementById("fileDrop");
const filePlaceholder = document.getElementById("filePlaceholder");
const filePreview = document.getElementById("filePreview");
const uploadStatus = document.getElementById("uploadStatus");
const publishButton = document.getElementById("publishButton");
const lightbox = document.getElementById("lightboxDialog");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxTitle = document.getElementById("lightboxTitle");
const lightboxDescription = document.getElementById("lightboxDescription");
const lightboxDate = document.getElementById("lightboxDate");
const lightboxIndex = document.getElementById("lightboxIndex");
const lightboxClose = document.getElementById("lightboxClose");

let ownerState = { authenticated: false, admin: false, user: null };
let currentItems = [];
let previewObjectUrl = null;

function formatDate(value) {
  return DATE_FORMATTER.format(new Date(value));
}

function getPublicImageUrl(path) {
  const cached = publicUrlCache.get(path);
  if (cached) return cached;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  publicUrlCache.set(path, data.publicUrl);
  return data.publicUrl;
}

function setLoadingState() {
  grid.replaceChildren();
  const state = document.createElement("div");
  state.className = "loading-state";

  const wrap = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = "LOADING ARCHIVE";
  const span = document.createElement("span");
  span.textContent = "이미지 기록을 불러오는 중입니다.";

  wrap.append(strong, span);
  state.append(wrap);
  grid.append(state);
}

function setEmptyState() {
  grid.replaceChildren();
  const state = document.createElement("div");
  state.className = "empty-state";

  const wrap = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = "NO VISUAL RECORDS";
  const span = document.createElement("span");
  span.textContent = ownerState.admin
    ? "OWNER ACCESS에서 첫 이미지를 등록할 수 있습니다."
    : "아직 등록된 이미지가 없습니다.";

  wrap.append(strong, span);
  state.append(wrap);
  grid.append(state);
}

function showLightbox(item, index) {
  lightboxImage.src = getPublicImageUrl(item.image_path);
  lightboxImage.alt = item.title;
  lightboxTitle.textContent = item.title;
  lightboxDescription.textContent = item.description || "설명이 없습니다.";
  lightboxDate.textContent = `REGISTERED / ${formatDate(item.created_at)}`;
  lightboxIndex.textContent = `VISUAL / ${String(index + 1).padStart(2, "0")}`;
  lightbox.showModal();
}

async function deleteItem(item, button) {
  if (!ownerState.admin) return;

  const confirmed = window.confirm(`“${item.title}” 항목을 삭제할까요?`);
  if (!confirmed) return;

  button.disabled = true;
  button.textContent = "DELETING...";

  const { error: deleteRowError } = await supabase
    .from("gallery_items")
    .delete()
    .eq("id", item.id);

  if (deleteRowError) {
    button.disabled = false;
    button.textContent = "DELETE";
    window.alert("갤러리 항목 삭제에 실패했습니다.");
    return;
  }

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([item.image_path]);

  publicUrlCache.delete(item.image_path);

  if (storageError) {
    console.warn("Gallery image cleanup failed:", storageError);
  }

  await loadGallery();
}

function createCard(item, index) {
  const article = document.createElement("article");
  article.className = "gallery-card";
  article.style.setProperty("--delay", `${Math.min(index * 38, 320)}ms`);

  const imageButton = document.createElement("button");
  imageButton.type = "button";
  imageButton.className = "card-image-button";
  imageButton.setAttribute("aria-label", `${item.title} 크게 보기`);

  const image = document.createElement("img");
  image.className = "card-image";
  image.src = getPublicImageUrl(item.image_path);
  image.alt = item.title;
  image.loading = "lazy";
  image.decoding = "async";
  imageButton.append(image);
  imageButton.addEventListener("click", () => showLightbox(item, index));

  const content = document.createElement("div");
  content.className = "card-content";

  const topline = document.createElement("div");
  topline.className = "card-topline";

  const number = document.createElement("span");
  number.textContent = `VISUAL ${String(index + 1).padStart(2, "0")}`;
  const date = document.createElement("span");
  date.textContent = formatDate(item.created_at);
  topline.append(number, date);

  const title = document.createElement("h2");
  title.className = "card-title";
  title.textContent = item.title;

  const description = document.createElement("p");
  description.className = "card-description";
  description.textContent = item.description || "설명이 없습니다.";

  content.append(topline, title, description);

  if (ownerState.admin) {
    const admin = document.createElement("div");
    admin.className = "card-admin";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "DELETE";
    deleteButton.addEventListener("click", () => deleteItem(item, deleteButton));

    admin.append(deleteButton);
    content.append(admin);
  }

  article.append(imageButton, content);
  return article;
}

function renderGallery() {
  itemCount.textContent = `${String(currentItems.length).padStart(2, "0")} VISUALS`;

  if (currentItems.length === 0) {
    setEmptyState();
    return;
  }

  const fragment = document.createDocumentFragment();
  currentItems.forEach((item, index) => {
    fragment.append(createCard(item, index));
  });
  grid.replaceChildren(fragment);
}

async function loadGallery() {
  setLoadingState();

  const { data, error } = await supabase
    .from("gallery_items")
    .select("id, title, description, image_path, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    grid.replaceChildren();
    const state = document.createElement("div");
    state.className = "empty-state";
    state.textContent = "갤러리를 불러오지 못했습니다.";
    grid.append(state);
    itemCount.textContent = "LOAD ERROR";
    console.error(error);
    return;
  }

  currentItems = data || [];
  renderGallery();
}

function renderOwnerZone() {
  ownerZone.replaceChildren();

  if (!ownerState.admin) {
    const login = document.createElement("a");
    login.className = "owner-login";
    login.href = `login.html?next=${encodeURIComponent(window.location.href)}`;
    login.textContent = "OWNER LOGIN";
    ownerZone.append(login);
    return;
  }

  const badge = document.createElement("span");
  badge.className = "owner-badge";
  badge.textContent = "OWNER ACTIVE";

  const upload = document.createElement("button");
  upload.type = "button";
  upload.className = "owner-action";
  upload.textContent = "+ UPLOAD";
  upload.addEventListener("click", () => uploadDialog.showModal());

  const logout = document.createElement("button");
  logout.type = "button";
  logout.className = "owner-action";
  logout.textContent = "LOGOUT";
  logout.addEventListener("click", async () => {
    await signOutOwner();
    ownerState = { authenticated: false, admin: false, user: null };
    renderOwnerZone();
    renderGallery();
  });

  ownerZone.append(badge, upload, logout);
}

function clearPreview() {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }

  filePreview.removeAttribute("src");
  filePreview.hidden = true;
  filePlaceholder.hidden = false;
}

function resetUploadForm() {
  uploadForm.reset();
  uploadStatus.textContent = "";
  publishButton.disabled = false;
  publishButton.textContent = "PUBLISH";
  clearPreview();
}

function setSelectedFile(file) {
  clearPreview();
  if (!file) return;

  if (!ALLOWED_TYPES.has(file.type)) {
    uploadStatus.textContent = "JPG, PNG, WEBP, GIF, AVIF 이미지만 업로드할 수 있습니다.";
    fileInput.value = "";
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    uploadStatus.textContent = "이미지는 최대 15MB까지 업로드할 수 있습니다.";
    fileInput.value = "";
    return;
  }

  previewObjectUrl = URL.createObjectURL(file);
  filePreview.src = previewObjectUrl;
  filePreview.hidden = false;
  filePlaceholder.hidden = true;
  uploadStatus.textContent = `${file.name} / ${(file.size / 1024 / 1024).toFixed(2)} MB`;
}

function extensionFor(file) {
  const mapping = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif"
  };
  return mapping[file.type] || "img";
}

async function publishItem(event) {
  event.preventDefault();

  const freshOwnerState = await getOwnerSession();
  if (!freshOwnerState.admin || !freshOwnerState.user) {
    uploadStatus.textContent = "OWNER SESSION이 만료되었습니다. 다시 로그인하세요.";
    return;
  }

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const file = fileInput.files?.[0];

  if (!title) {
    uploadStatus.textContent = "제목을 입력하세요.";
    titleInput.focus();
    return;
  }

  if (title.length > 120) {
    uploadStatus.textContent = "제목은 120자 이하로 입력하세요.";
    return;
  }

  if (description.length > 3000) {
    uploadStatus.textContent = "설명은 3000자 이하로 입력하세요.";
    return;
  }

  if (!file || !ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE) {
    uploadStatus.textContent = "업로드할 이미지를 선택하세요.";
    return;
  }

  publishButton.disabled = true;
  publishButton.textContent = "UPLOADING...";
  uploadStatus.textContent = "이미지를 전송하고 있습니다.";

  const ext = extensionFor(file);
  const path = `${freshOwnerState.user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    publishButton.disabled = false;
    publishButton.textContent = "PUBLISH";
    uploadStatus.textContent = "이미지 업로드에 실패했습니다.";
    console.error(uploadError);
    return;
  }

  const { error: insertError } = await supabase
    .from("gallery_items")
    .insert({
      title,
      description,
      image_path: path,
      created_by: freshOwnerState.user.id
    });

  if (insertError) {
    await supabase.storage.from(BUCKET).remove([path]);
    publishButton.disabled = false;
    publishButton.textContent = "PUBLISH";
    uploadStatus.textContent = "갤러리 등록에 실패했습니다.";
    console.error(insertError);
    return;
  }

  uploadStatus.textContent = "등록되었습니다.";
  await loadGallery();

  window.setTimeout(() => {
    uploadDialog.close();
    resetUploadForm();
  }, 180);
}

fileInput.addEventListener("change", () => setSelectedFile(fileInput.files?.[0]));

["dragenter", "dragover"].forEach(type => {
  fileDrop.addEventListener(type, event => {
    event.preventDefault();
    fileDrop.classList.add("is-dragging");
  });
});

["dragleave", "drop"].forEach(type => {
  fileDrop.addEventListener(type, event => {
    event.preventDefault();
    fileDrop.classList.remove("is-dragging");
  });
});

fileDrop.addEventListener("drop", event => {
  const file = event.dataTransfer?.files?.[0];
  if (!file) return;

  const transfer = new DataTransfer();
  transfer.items.add(file);
  fileInput.files = transfer.files;
  setSelectedFile(file);
});

uploadForm.addEventListener("submit", publishItem);
uploadCloseButton.addEventListener("click", () => uploadDialog.close());
lightboxClose.addEventListener("click", () => lightbox.close());

uploadDialog.addEventListener("close", () => {
  if (!publishButton.disabled) resetUploadForm();
});

lightbox.addEventListener("close", () => {
  lightboxImage.removeAttribute("src");
  lightboxImage.alt = "";
});

[uploadDialog, lightbox].forEach(dialog => {
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
});

ownerState = await getOwnerSession();
renderOwnerZone();
await loadGallery();
