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
  gallery.innerHTML = ""; videoList.innerHTML = "";
  const photos = items.filter(x => x.type === "photo");
  const videos = items.filter(x => x.type === "video");
  photos.forEach(x => {
    const el=document.createElement("div"); el.className="gallery-item";
    el.innerHTML=`<img src="${x.public_url}" alt="${esc(x.name)}" loading="lazy">`;
    gallery.appendChild(el);
  });
  videos.forEach(x => {
    const el=document.createElement("div"); el.className="video-card";
    el.innerHTML=`<video controls preload="metadata" src="${x.public_url}"></video><p>${esc(x.name)}</p>`;
    videoList.appendChild(el);
  });
  emptyGallery.style.display = photos.length ? "none" : "block";
  emptyVideos.style.display = videos.length ? "none" : "block";
  photoCount.textContent = photos.length;
  videoCount.textContent = videos.length;
  document.querySelector("#memoryCount").textContent = items.length;
}
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