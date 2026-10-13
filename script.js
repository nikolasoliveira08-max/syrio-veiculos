(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const kmFmt = (n) => (n ? n.toLocaleString("pt-BR") + " km" : "—");
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const whatsUrl = (msg) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  const foto = (f) => (/^https?:|^\//.test(f) ? f : `img/carros/${f}`);
  const anoModelo = (c) => parseInt(String(c.ano).split("/").pop(), 10) || 0;

  const CAR_SVG = `<svg viewBox="0 0 200 80" fill="currentColor" aria-hidden="true"><path d="M18 58c-6 0-10-3-10-8v-6c0-4 3-6 7-7l22-4 22-14c5-3 10-4 16-4h40c7 0 12 2 17 6l16 13 28 4c6 1 10 5 10 11v4c0 3-2 5-5 5h-9a17 17 0 00-33 0H69a17 17 0 00-33 0zM80 22l-14 11h38V20H90c-4 0-7 1-10 2zm32-2v13h40l-12-10c-3-2-6-3-10-3z"/><circle cx="52" cy="60" r="12"/><circle cx="150" cy="60" r="12"/></svg>`;
  const placeholder = () => `<div class="placeholder">${CAR_SVG}<span>Fotos em breve</span></div>`;

  /* ---------- Links globais ---------- */
  document.querySelectorAll(".js-whats").forEach((a) => (a.href = whatsUrl(a.dataset.msg || "Olá!")));
  document.querySelectorAll(".js-insta").forEach((a) => (a.href = `https://instagram.com/${CONFIG.instagram}`));
  $("#ano").textContent = new Date().getFullYear();
  $("#contactList").innerHTML = [
    CONFIG.endereco && `<li><b>Endereço:</b> ${esc(CONFIG.endereco)}</li>`,
    `<li><b>Local:</b> ${esc(CONFIG.cidade)}</li>`,
    CONFIG.horario && `<li><b>Horário:</b> ${esc(CONFIG.horario)}</li>`,
    `<li><b>Instagram:</b> @${esc(CONFIG.instagram)}</li>`,
  ].filter(Boolean).join("");

  /* ---------- Menu mobile ---------- */
  const toggle = $("#menuToggle"), nav = $("#nav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", (e) => {
    if (e.target.tagName === "A") { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); }
  });

  /* ---------- Estoque ---------- */
  const grid = $("#grid"), fBusca = $("#fBusca"), fMarca = $("#fMarca"), fOrdem = $("#fOrdem"), fVendidos = $("#fVendidos");

  $("#statDisponiveis").textContent = CARROS.filter((c) => c.status !== "vendido").length;
  [...new Set(CARROS.map((c) => c.marca))].sort().forEach((m) => fMarca.add(new Option(m, m)));

  function priceBlock(c) {
    if (c.status === "vendido") return `<span class="price price--consult">Vendido</span>`;
    const p = c.preco ? `<span class="price">${brl(c.preco)}</span>` : `<span class="price price--consult">Consulte</span>`;
    const abaixo = c.preco && c.fipe && c.fipe > c.preco
      ? `<span class="fipe"><b>${brl(c.fipe - c.preco)} abaixo</b>FIPE ${brl(c.fipe)}</span>` : "";
    return p + abaixo;
  }

  function badges(c) {
    const b = [];
    if (c.status === "vendido") b.push(`<span class="badge">Vendido</span>`);
    else if (c.status === "reservado") b.push(`<span class="badge">Reservado</span>`);
    else if (c.destaque) b.push(`<span class="badge badge--orange">Destaque</span>`);
    if (c.status !== "vendido" && c.preco && c.fipe > c.preco) b.push(`<span class="badge badge--green">Abaixo da FIPE</span>`);
    if (c.agenciado) b.push(`<span class="badge">Agenciado</span>`);
    if (c.leilao) b.push(`<span class="badge badge--warn">Leilão</span>`);
    return b.join("");
  }

  function card(c) {
    const media = c.fotos?.length ? `<img src="${esc(foto(c.fotos[0]))}" alt="${esc(c.marca + " " + c.modelo)}" loading="lazy">` : placeholder();
    return `<button class="car${c.status === "vendido" ? " is-sold" : ""}" data-id="${esc(c.id)}">
      <div class="car__media">${media}<div class="badges">${badges(c)}</div></div>
      <div class="car__body">
        <span class="car__brand">${esc(c.marca)}</span>
        <span class="car__title">${esc(c.modelo)}</span>
        <span class="car__versao">${esc(c.versao)}</span>
        <div class="car__meta"><span>${esc(c.ano)}</span><span>${kmFmt(c.km)}</span><span>${esc(c.cambio)}</span></div>
        <div class="car__price">${priceBlock(c)}</div>
      </div>
    </button>`;
  }

  function render() {
    const q = fBusca.value.trim().toLowerCase();
    let list = CARROS.filter((c) =>
      (fVendidos.checked || c.status !== "vendido") &&
      (!fMarca.value || c.marca === fMarca.value) &&
      (!q || `${c.marca} ${c.modelo} ${c.versao} ${c.ano}`.toLowerCase().includes(q))
    );
    const sold = (c) => (c.status === "vendido" ? 1 : 0);
    const pr = (c, dir) => c.preco || (dir > 0 ? Infinity : -Infinity);
    const sorters = {
      destaque: (a, b) => sold(a) - sold(b) || (b.destaque === true) - (a.destaque === true) || anoModelo(b) - anoModelo(a),
      menor: (a, b) => sold(a) - sold(b) || pr(a, 1) - pr(b, 1),
      maior: (a, b) => sold(a) - sold(b) || pr(b, -1) - pr(a, -1),
      novo: (a, b) => sold(a) - sold(b) || anoModelo(b) - anoModelo(a),
      km: (a, b) => sold(a) - sold(b) || (a.km || Infinity) - (b.km || Infinity),
    };
    list.sort(sorters[fOrdem.value]);
    grid.innerHTML = list.map(card).join("");
    $("#empty").hidden = list.length > 0;
    $("#resultsCount").textContent = `${list.length} ${list.length === 1 ? "veículo encontrado" : "veículos encontrados"}`;
  }

  [fBusca, fMarca, fOrdem, fVendidos].forEach((el) => el.addEventListener("input", render));
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".car");
    if (btn) openModal(CARROS.find((c) => c.id === btn.dataset.id));
  });
  render();

  /* ---------- Modal ---------- */
  const modal = $("#modal");
  function showPhoto(c, i) {
    $("#mMain").innerHTML = c.fotos.length ? `<img src="${esc(foto(c.fotos[i]))}" alt="${esc(c.modelo)} — foto ${i + 1}">` : placeholder();
    $("#mThumbs").querySelectorAll("button").forEach((b, j) => b.classList.toggle("is-active", i === j));
  }
  function openModal(c) {
    if (!c) return;
    const fotos = c.fotos || [];
    $("#mMarca").textContent = c.marca;
    $("#mTitle").textContent = c.modelo;
    $("#mVersao").textContent = c.versao;
    $("#mPrice").innerHTML = priceBlock(c);
    $("#mSpecs").innerHTML = [["Ano", c.ano], ["KM", c.km && kmFmt(c.km)], ["Câmbio", c.cambio], ["Combustível", c.combustivel], ["Cor", c.cor], ["Leilão", c.leilao]]
      .filter(([, v]) => v)
      .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("");
    $("#mDesc").textContent = c.descricao || "";
    $("#mOpc").innerHTML = (c.opcionais || []).map((o) => `<li>${esc(o)}</li>`).join("");
    $("#mThumbs").innerHTML = fotos.length > 1
      ? fotos.map((f, i) => `<button data-i="${i}" aria-label="Foto ${i + 1}"><img src="${esc(foto(f))}" alt="" loading="lazy"></button>`).join("") : "";
    $("#mThumbs").onclick = (e) => { const b = e.target.closest("button"); if (b) showPhoto(c, +b.dataset.i); };
    showPhoto(c, 0);
    const wa = $("#mWhats");
    if (c.status === "vendido") {
      wa.textContent = "Quero um parecido";
      wa.href = whatsUrl(`Olá! Vi que o ${c.marca} ${c.modelo} ${c.ano} foi vendido. Vocês têm algo parecido?`);
    } else {
      wa.textContent = "Tenho interesse";
      wa.href = whatsUrl(`Olá! Tenho interesse no ${c.marca} ${c.modelo} ${c.versao} ${c.ano}${c.preco ? ` (${brl(c.preco)})` : ""}. Ainda está disponível?`);
    }
    modal.showModal();
  }
  $("#mClose").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });

  /* ---------- Formulário de agenciamento ---------- */
  $("#formAgenciar").addEventListener("submit", (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const ok = d.nome.trim() && d.modelo.trim() && d.ano.trim();
    $("#formError").hidden = !!ok;
    if (!ok) return;
    const msg = [
      "Olá! Quero vender meu carro com a Syrio Veículos.",
      `*Nome:* ${d.nome}`,
      `*Veículo:* ${d.modelo} — ${d.ano}`,
      d.km && `*KM:* ${d.km}`,
      d.valor && `*Valor pretendido:* ${d.valor}`,
      d.obs && `*Obs.:* ${d.obs}`,
    ].filter(Boolean).join("\n");
    window.open(whatsUrl(msg), "_blank", "noopener");
  });
})();
