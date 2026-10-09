import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  BUCKET
} from "./config.js";

console.log("Supabase URL:", SUPABASE_URL);
console.log("Bucket:", BUCKET);

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
// LOGIN
const loginScreen = document.querySelector("#loginScreen");
const loginEmail = document.querySelector("#loginEmail");
const loginPassword = document.querySelector("#loginPassword");
const loginBtn = document.querySelector("#loginBtn");
const loginStatus = document.querySelector("#loginStatus");

async function checkLogin() {
  sessionStorage.setItem("oneclass_admin", "false");

  await supabase.auth.signOut();

  const adminBtn = document.querySelector("#adminBtn");

  if (adminBtn) {
    adminBtn.style.display = "none";
  }

  loginScreen.style.display = "grid";

  await loadMedia();
}

loginBtn.addEventListener("click", async () => {
  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (!email || !password) {
    loginStatus.textContent = "Email болон password оруулна уу.";
    return;
  }

  loginStatus.textContent = "Нэвтэрч байна…";
  loginBtn.disabled = true;

  const { data,error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    loginStatus.textContent = "Email эсвэл password буруу байна.";
    loginBtn.disabled = false;
    return;
  }
const user = data.user;
const isAdmin =
  user.email?.toLowerCase() ===
  "ariunbayraltanshagai218@gmail.com";

sessionStorage.setItem("oneclass_admin", isAdmin ? "true" : "false");

console.log("ADMIN:", isAdmin);

const adminBtn = document.querySelector("#adminBtn");
if (adminBtn) {
  adminBtn.style.display = isAdmin ? "inline-block" : "none";
}
  loginStatus.textContent = "Амжилттай нэвтэрлээ!";
loginScreen.style.display = "none";

await loadMedia();
await loadMembers();

loginBtn.disabled = false;
});

checkLogin();
const logoutBtn = document.querySelector("#logoutBtn");

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();

  sessionStorage.setItem("oneclass_admin", "false");

  const adminBtn = document.querySelector("#adminBtn");

  if (adminBtn) {
    adminBtn.style.display = "none";
  }

  loginScreen.style.display = "grid";

  await loadMedia();
});
const gallery = document.querySelector("#gallery");
const videoList = document.querySelector("#videoList");
const fileInput = document.querySelector("#fileInput");
const emptyGallery = document.querySelector("#emptyGallery");
const emptyVideos = document.querySelector("#emptyVideos");
const photoCount = document.querySelector("#photoCount");
const videoCount = document.querySelector("#videoCount");
const status = document.querySelector("#status");

async function loadMedia() {
  status.textContent = "Дурсамжуудыг ачаалж байна…";

  const { data, error } = await supabase
    .from("media")
    .select("*")
    .order("created_at", { ascending: false });

  console.log("MEDIA:", data);
  console.log("MEDIA ERROR:", error);

  if (error) {
    console.error("SUPABASE ERROR:", error);
    status.textContent = `Алдаа: ${error.message}`;
    return;
  }

  render(data || []);
  status.textContent = "";
}
function render(items) {
  gallery.innerHTML = "";
  videoList.innerHTML = "";

  const isAdmin =
  sessionStorage.getItem("oneclass_admin") === "true" &&
  supabase.auth.getSession() !== null;

  const photos = items.filter(x => x.type === "photo");
  const videos = items.filter(x => x.type === "video");

photos.forEach(x => {
  const el = document.createElement("div");
  el.className = "gallery-item";

  el.innerHTML = `
    <img
      src="${esc(x.public_url)}"
      alt="${esc(x.name)}"
      loading="lazy"
    >

    <div class="media-actions">
      <button
        type="button"
        class="download-btn"
        data-path="${esc(x.path)}"
        data-name="${esc(x.name)}"
      >
        ⬇ Зураг татах
      </button>

      ${isAdmin ? `
        <button
          type="button"
          class="delete-media-btn"
          data-id="${esc(x.id)}"
          data-path="${esc(x.path)}"
        >
          🗑 Устгах
        </button>
      ` : ""}
    </div>
  `;

  gallery.appendChild(el);
});
videos.forEach(x => {
  const el = document.createElement("div");
  el.className = "video-card";

    el.innerHTML = `
      <video controls preload="metadata" src="${x.public_url}"></video>

      <p>${esc(x.name)}</p>

      <button
        class="download-video-btn"
        data-path="${x.path}"
        data-name="${esc(x.name)}"
      >
        ↓ Бичлэг татах
      </button>

      ${isAdmin ? `
        <button
          class="delete-media-btn"
          data-id="${x.id}"
          data-path="${x.path}"
        >
          🗑 Устгах
        </button>
      ` : ""}
    `;

    videoList.appendChild(el);
  });

  emptyGallery.style.display = photos.length ? "none" : "block";
  emptyVideos.style.display = videos.length ? "none" : "block";

  photoCount.textContent = photos.length;
  videoCount.textContent = videos.length;

  document.querySelector("#memoryCount").textContent = items.length;
}
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".download-btn, .download-video-btn");

  if (!btn) return;

  const path = btn.dataset.path;
  const name = btn.dataset.name;

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path);

  if (!data?.publicUrl) {
    alert("Файлын холбоос олдсонгүй.");
    return;
  }

  const downloadUrl =
    data.publicUrl +
    "?download=" +
    encodeURIComponent(name);

  window.open(downloadUrl, "_blank");
});
fileInput.addEventListener("change", async (e) => {
  const files = [...e.target.files];
  if (!files.length) return;

  for (const file of files) {
    try {
      if (file.size > 50 * 1024 * 1024) {
        alert(`${file.name}: 50 MB-аас бага файл сонгоно уу.`);
        continue;
      }

      status.textContent = `${file.name} байршуулж байна…`;

      // Файлын нэрийг аюулгүй болгоно
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

      // crypto.randomUUID ашиглахгүй
      const id = Date.now() + "-" + Math.random().toString(36).slice(2);

      const path = `${id}-${safe}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          upsert: false,
          contentType: file.type
        });

      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

      const type = file.type.startsWith("video/")
        ? "video"
        : "photo";

      const { error: dbErr } = await supabase
        .from("media")
        .insert({
          name: file.name,
          type: type,
          path: path,
          public_url: urlData.publicUrl
        });

      if (dbErr) throw dbErr;

    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      alert(`${file.name} байршуулж чадсангүй.\n${err.message || err}`);
    }
  }

  e.target.value = "";
  await loadMedia();
});
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
loadMedia();
async function loadMembers() {
  const memberList = document.querySelector("#memberList");
  const memberAddBox = document.querySelector(".member-add-box");
  const isAdmin =
  loginEmail.value.trim().toLowerCase() ===
  "ariunbayraltanshagai218@gmail.com";
  if (memberAddBox) {
  memberAddBox.style.display = isAdmin ? "block" : "none";
  }
  const memberCount = document.querySelector("#memberCount");

  if (!memberList) return;

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("MEMBERS ERROR:", error);
    return;
  }

  memberList.innerHTML = "";

  memberCount.textContent = data.length;

  data.forEach(member => {
    const card = document.createElement("div");
    card.className = "member-card";
    const isAdmin = sessionStorage.getItem("oneclass_admin") === "true";

    const firstLetter = member.name
      ? member.name.charAt(0).toUpperCase()
      : "?";

        card.innerHTML = `
      ${
        member.photo_url
          ? `<img class="member-photo" src="${member.photo_url}" alt="${esc(member.name)}">`
          : `<div class="member-placeholder">${esc(firstLetter)}</div>`
      }

      <h3>${esc(member.name)}</h3>
      <p>${esc(member.role || "Сурагч")}</p>

      ${isAdmin ? `
        <button class="delete-member-btn" data-id="${member.id}">
          🗑 Устгах
        </button>

        <button class="edit-member-btn" data-id="${member.id}">
          ✏️ Засах
        </button>
      ` : ""}
    `;

    memberList.appendChild(card);
  });
}

loadMembers();
const addMemberBtn = document.querySelector("#addMemberBtn");
if (addMemberBtn) {
  addMemberBtn.addEventListener("click", async () => {
    const name = document.querySelector("#memberName").value.trim();
    const role = document.querySelector("#memberRole").value.trim();
    const photo = document.querySelector("#memberPhoto").files[0];
    const memberStatus = document.querySelector("#memberStatus");

    if (!name) {
      memberStatus.textContent = "Нэрээ оруулна уу.";
      return;
    }

    memberStatus.textContent = "Сурагч нэмж байна…";
    addMemberBtn.disabled = true;

    try {
      let photo_url = null;

      if (photo) {
        const safe = photo.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = Date.now() + "-" + Math.random().toString(36).slice(2) + "-" + safe;

        const { error: uploadError } = await supabase
          .storage
          .from("class-members")
          .upload(path, photo, {
            upsert: false,
            contentType: photo.type
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase
          .storage
          .from("class-members")
          .getPublicUrl(path);

        photo_url = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("members")
        .insert({
          name: name,
          role: role || "Сурагч",
          photo_url: photo_url
        });

      if (error) throw error;

      memberStatus.textContent = "Сурагч амжилттай нэмэгдлээ!";

      document.querySelector("#memberName").value = "";
      document.querySelector("#memberRole").value = "Сурагч";
      document.querySelector("#memberPhoto").value = "";

      await loadMembers();

    } catch (error) {
      console.error(error);
      memberStatus.textContent = "Алдаа: " + error.message;
    }

    addMemberBtn.disabled = false;
  });
}
// PAGE NAVIGATION
const navLinks = document.querySelectorAll("nav a");
const joinLink = document.querySelector(".join");
const heroLinks = document.querySelectorAll(".hero-actions a");

function showSection(id) {
  const sections = [
    document.querySelector(".hero"),
    document.querySelector(".stats"),
    document.querySelector("#photos"),
    document.querySelector("#videos"),
    document.querySelector("#memories"),
    document.querySelector("#members"),
    document.querySelector("#upload"),
    document.querySelector("#admin")
  ];
  const adminBtn = document.querySelector("#adminBtn");

if (adminBtn) {
  adminBtn.addEventListener("click", e => {
    e.preventDefault();
    showSection("#admin");
    window.scrollTo(0, 0);
  });
}

  sections.forEach(section => {
    if (section) {
      section.classList.add("page-section-hidden");
    }
  });

  const target = document.querySelector(id);

  if (target) {
    target.classList.remove("page-section-hidden");
  }
}

navLinks.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    showSection(link.getAttribute("href"));
  });
});

if (joinLink) {
  joinLink.addEventListener("click", e => {
    e.preventDefault();
    showSection("#upload");
  });
}

heroLinks.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    showSection(link.getAttribute("href"));
  });
});

// Эхлэхэд нүүр хэсэг харагдана
showSection(".hero");
const adminMembersBtn = document.querySelector("#adminMembersBtn");

if (adminMembersBtn) {
  adminMembersBtn.addEventListener("click", () => {
    showSection("#members");
    window.scrollTo(0, 0);
  });
}
const brand = document.querySelector(".brand");

if (brand) {
  brand.addEventListener("click", e => {
    e.preventDefault();
    showSection(".hero");
    window.scrollTo(0, 0);
  });
}
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".delete-member-btn");

  if (!btn) return;

  const id = btn.dataset.id;

  if (!confirm("Энэ сурагчийг устгах уу?")) return;

  const { error } = await supabase
    .from("members")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Устгаж чадсангүй: " + error.message);
    return;
  }

  await loadMembers();
});
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".edit-member-btn");

  if (!btn) return;

  const id = btn.dataset.id;

  const name = prompt("Шинэ нэр оруулна уу:");
  if (name === null || !name.trim()) return;

  const role = prompt("Мэргэжил / анги:", "Сурагч");
  if (role === null) return;

  const { error } = await supabase
    .from("members")
    .update({
      name: name.trim(),
      role: role.trim() || "Сурагч"
    })
    .eq("id", id);

  if (error) {
    alert("Засаж чадсангүй: " + error.message);
    return;
  }

  await loadMembers();
});
// ADMIN MEDIA NAVIGATION
const adminMediaBtn = document.querySelector("#adminMediaBtn");

if (adminMediaBtn) {
  adminMediaBtn.addEventListener("click", () => {
    showSection("#photos");
    window.scrollTo(0, 0);
  });
}
// Зураг, видео устгах
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".delete-media-btn");
  if (!btn) return;

  // Админ биш бол устгахгүй
  if (sessionStorage.getItem("oneclass_admin") !== "true") {
    alert("Зөвхөн админ устгах боломжтой!");
    return;
  }

  const id = btn.dataset.id;
  const path = btn.dataset.path;

  if (!confirm("Энэ зураг эсвэл бичлэгийг устгах уу?")) {
    return;
  }

  btn.disabled = true;
  btn.textContent = "Устгаж байна...";

  // Эхлээд Storage-оос файлыг устгана
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([path]);

  if (storageError) {
    alert("Файл устгаж чадсангүй: " + storageError.message);
    btn.disabled = false;
    btn.textContent = "🗑 Устгах";
    return;
  }

  // Дараа нь өгөгдлийн сангаас бичлэгийг устгана
  const { error: dbError } = await supabase
    .from("media")
    .delete()
    .eq("id", id);

  if (dbError) {
    alert("Өгөгдөл устгаж чадсангүй: " + dbError.message);
    await loadMedia();
    return;
  }

  alert("Амжилттай устгалаа!");
  await loadMedia();
});