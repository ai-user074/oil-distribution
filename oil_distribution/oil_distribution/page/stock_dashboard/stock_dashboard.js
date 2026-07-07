frappe.pages['stock-dashboard'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Stock Dashboard',
		single_column: true,
	});

	window.sd_company = 'All';
	window.sd_tab = 'overview';

	page.main.html(get_dashboard_html());

	// Tabs
	page.main.find('.sd-tab-btn').on('click', function () {
		var tab = $(this).data('tab');
		window.sd_tab = tab;
		page.main.find('.sd-tab-btn').removeClass('sd-tab-active');
		$(this).addClass('sd-tab-active');
		page.main.find('.sd-tab-panel').hide();
		page.main.find('#sd-panel-' + tab).show();
	});

	// Company filter
	page.main.find('#sd-company-select').on('change', function () {
		window.sd_company = $(this).val();
		load_all();
	});

	page.add_button(__("Refresh"), function () { load_all(); }, "refresh");
	load_all();
};

function get_dashboard_html() {
	return `
	<style>
		#page-stock-dashboard .page-body { padding: 0 !important; background: #f0f2f5; }
		.sd { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; padding: 16px 20px; }
		.sd * { box-sizing: border-box; }

		/* Bar */
		.sd-bar { display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 14px; }
		.sd-bar label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; }
		.sd-bar select { padding: 5px 26px 5px 8px; border-radius: 7px; border: 1px solid #e2e8f0; background: #f8fafc; color: #334155; font-size: 11px; font-weight: 600; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%2394a3b8'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 7px center; }
		.sd-bar select:focus { outline: none; border-color: #3b82f6; }

		/* Tabs */
		.sd-tabs { display: flex; gap: 2px; margin-bottom: 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 4px; width: fit-content; }
		.sd-tab-btn { padding: 7px 18px; border-radius: 8px; border: none; background: transparent; font-size: 11px; font-weight: 700; cursor: pointer; color: #94a3b8; transition: all 0.2s; }
		.sd-tab-btn:hover { color: #475569; background: #f8fafc; }
		.sd-tab-active { background: #3b82f6 !important; color: #fff !important; }

		/* KPI */
		.sd-kpi-row { display: grid; gap: 10px; margin-bottom: 14px; grid-template-columns: repeat(5, 1fr); }
		.sd-kpi { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 12px; }
		.sd-kpi:hover { box-shadow: 0 4px 12px rgba(0,20,40,0.08); transform: translateY(-2px); }
		.sd-kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
		.sd-kpi-val { font-size: 20px; font-weight: 800; line-height: 1.1; }
		.sd-kpi-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-top: 1px; }

		/* Card */
		.sd-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 14px; }
		.sd-card-head { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
		.sd-card-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; }
		.sd-card-title { font-size: 12px; font-weight: 700; color: #1e293b; }
		.sd-card-sub { font-size: 9px; color: #94a3b8; }

		/* Table */
		.sd-table { width: 100%; border-collapse: collapse; font-size: 11px; }
		.sd-table th { text-align: left; padding: 7px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
		.sd-table td { padding: 8px 10px; border-bottom: 1px solid #f8fafc; color: #475569; }
		.sd-table tr { cursor: pointer; transition: background 0.15s; }
		.sd-table tr:hover { background: #f1f5f9; }

		.sd-badge { display: inline-block; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
		.sd-link { font-size: 10px; font-weight: 600; color: #3b82f6; cursor: pointer; text-decoration: none; }
		.sd-link:hover { text-decoration: underline; }

		.sd-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
		.sd-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 14px; }
		.sd-grid-5-5 { display: grid; grid-template-columns: 5fr 5fr; gap: 12px; margin-bottom: 14px; }
		.sd-grid-6-4 { display: grid; grid-template-columns: 6fr 4fr; gap: 12px; margin-bottom: 14px; }

		/* Progress */
		.sd-prog { height: 5px; border-radius: 5px; background: #f1f5f9; overflow: hidden; }
		.sd-prog-fill { height: 100%; border-radius: 5px; transition: width 0.6s ease; }

		/* Company card */
		.sd-co-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 10px; transition: all 0.2s; }
		.sd-co-card:hover { box-shadow: 0 2px 8px rgba(0,20,40,0.06); }
		.sd-co-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
		.sd-co-name { font-size: 14px; font-weight: 800; }
		.sd-co-stats { display: flex; gap: 12px; }
		.sd-co-stat { font-size: 10px; font-weight: 700; color: #64748b; }
		.sd-co-stat span { font-size: 13px; font-weight: 800; display: block; margin-top: 1px; }

		/* Warehouse mini card */
		.sd-wh { border: 1px solid #f1f5f9; border-radius: 8px; padding: 10px; margin-bottom: 6px; transition: all 0.15s; }
		.sd-wh:hover { border-color: #e2e8f0; background: #f8fafc; }
		.sd-wh-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
		.sd-wh-name { font-size: 10px; font-weight: 700; color: #1e293b; }
		.sd-wh-stats { font-size: 9px; color: #94a3b8; }

		/* Item mini card */
		.sd-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; margin-bottom: 3px; transition: background 0.15s; }
		.sd-item:hover { background: #f1f5f9; }
		.sd-item-name { flex: 1; font-size: 10px; font-weight: 700; color: #1e293b; }
		.sd-item-qty { font-size: 11px; font-weight: 800; }
		.sd-item-val { font-size: 9px; color: #94a3b8; }

		/* Ring */
		.sd-ring { position: relative; display: inline-block; }

		/* Negative alert */
		.sd-neg { border-left: 3px solid #dc2626; background: #fef2f2; border-radius: 0 8px 8px 0; padding: 8px 12px; margin-bottom: 6px; }

		/* Anim */
		@keyframes sdFadeIn { 0%{opacity:0;transform:translateY(8px);}100%{opacity:1;transform:translateY(0);} }
		.sd-anim { animation: sdFadeIn 0.35s ease both; }
	</style>

	<div class="sd">
		<!-- FILTERS -->
		<div class="sd-bar sd-anim">
			<label>Company</label>
			<select id="sd-company-select">
				<option value="All" selected>All Companies</option>
				<option value="Geeta Enterprise">Geeta Enterprise (GE)</option>
				<option value="Global Export">Global Export (GEX)</option>
				<option value="Shubham Enterprise">Shubham Enterprise (SHE)</option>
			</select>
			<span id="sd-filter-tag" style="margin-left:auto;font-size:9px;font-weight:700;padding:3px 8px;border-radius:6px;background:#eff6ff;color:#3b82f6;">All Companies</span>
		</div>

		<!-- TABS -->
		<div class="sd-tabs sd-anim" style="animation-delay:0.04s">
			<button class="sd-tab-btn sd-tab-active" data-tab="overview">Overview</button>
			<button class="sd-tab-btn" data-tab="company">By Company</button>
			<button class="sd-tab-btn" data-tab="item">By Item</button>
			<button class="sd-tab-btn" data-tab="swastik">Swastik Reserved</button>
		</div>

		<!-- ═══ PANEL: OVERVIEW ═══ -->
		<div id="sd-panel-overview" class="sd-tab-panel">
			<!-- KPIs -->
			<div class="sd-kpi-row sd-anim" style="animation-delay:0.06s" id="sd-kpis"></div>

			<!-- Charts row -->
			<div class="sd-grid-5-5 sd-anim" style="animation-delay:0.1s">
				<div class="sd-card" style="margin-bottom:0;">
					<div class="sd-card-head">
						<div class="sd-card-icon" style="background:#dbeafe;color:#3b82f6;">📊</div>
						<div><div class="sd-card-title">Stock by Company</div><div class="sd-card-sub">Available vs Reserved</div></div>
					</div>
					<div id="sd-chart-company" style="display:flex;justify-content:center;"></div>
				</div>
				<div class="sd-card" style="margin-bottom:0;">
					<div class="sd-card-head">
						<div class="sd-card-icon" style="background:#ede9fe;color:#7c3aed;">📦</div>
						<div><div class="sd-card-title">Stock by Warehouse Type</div><div class="sd-card-sub">Available vs Reserved</div></div>
					</div>
					<div id="sd-chart-wh" style="display:flex;justify-content:center;"></div>
				</div>
			</div>

			<!-- Negative Alerts -->
			<div class="sd-card sd-anim" style="animation-delay:0.14s">
				<div class="sd-card-head">
					<div class="sd-card-icon" style="background:#fef2f2;color:#dc2626;">⚠</div>
					<div style="flex:1;"><div class="sd-card-title">Negative Stock Alerts</div><div class="sd-card-sub">Requires attention</div></div>
					<a class="sd-link" style="color:#dc2626;" onclick="frappe.set_route('List','Bin',{actual_qty:['<',0]})">View All →</a>
				</div>
				<div id="sd-neg-alerts"></div>
			</div>
		</div>

		<!-- ═══ PANEL: BY COMPANY ═══ -->
		<div id="sd-panel-company" class="sd-tab-panel" style="display:none;">
			<div id="sd-company-list"></div>
		</div>

		<!-- ═══ PANEL: BY ITEM ═══ -->
		<div id="sd-panel-item" class="sd-tab-panel" style="display:none;">
			<div class="sd-card sd-anim">
				<div class="sd-card-head">
					<div class="sd-card-icon" style="background:#ede9fe;color:#7c3aed;">📋</div>
					<div><div class="sd-card-title">Item-wise Stock Summary</div><div class="sd-card-sub">All items across companies</div></div>
				</div>
				<div id="sd-item-table"></div>
			</div>
		</div>

		<!-- ═══ PANEL: SWASTIK RESERVED ═══ -->
		<div id="sd-panel-swastik" class="sd-tab-panel" style="display:none;">
			<div id="sd-swastik-kpis" class="sd-kpi-row sd-anim" style="animation-delay:0.06s;grid-template-columns:repeat(4,1fr);"></div>
			<div class="sd-grid-5-5 sd-anim" style="animation-delay:0.1s">
				<div class="sd-card" style="margin-bottom:0;">
					<div class="sd-card-head">
						<div class="sd-card-icon" style="background:#fef3c7;color:#d97706;">🛡</div>
						<div><div class="sd-card-title">Reserved by Company</div></div>
					</div>
					<div id="sd-swastik-company"></div>
				</div>
				<div class="sd-card" style="margin-bottom:0;">
					<div class="sd-card-head">
						<div class="sd-card-icon" style="background:#ede9fe;color:#7c3aed;">📦</div>
						<div><div class="sd-card-title">Reserved by Item</div></div>
					</div>
					<div id="sd-swastik-item"></div>
				</div>
			</div>
			<div class="sd-card sd-anim" style="animation-delay:0.14s">
				<div class="sd-card-head">
					<div class="sd-card-icon" style="background:#fef3c7;color:#d97706;">📋</div>
					<div style="flex:1;"><div class="sd-card-title">Reservation Detail</div></div>
				</div>
				<div id="sd-swastik-detail"></div>
			</div>
		</div>
	</div>`;
}

/* ═══════════ UTILITIES ═══════════ */

function sd_k(v) { v = parseFloat(v) || 0; if (Math.abs(v) >= 1000) return '₹' + (v / 1000).toFixed(1) + 'K'; return '₹' + v.toFixed(0); }
function sd_n(v) { v = parseFloat(v) || 0; if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + 'K'; return v.toFixed(0); }
function sd_count(el, target, pre, suf, dur) {
	pre = pre || ''; suf = suf || ''; dur = dur || 1200;
	var start = null;
	function step(ts) { if (!start) start = ts; var p = Math.min((ts - start) / dur, 1); var e = 1 - Math.pow(1 - p, 3); el.textContent = pre + Math.floor(e * target).toLocaleString() + suf; if (p < 1) requestAnimationFrame(step); }
	requestAnimationFrame(step);
}

/* ═══════════ DONUT CHART ═══════════ */

function sd_donut(el, data, size) {
	size = size || 130;
	var total = data.reduce(function (s, d) { return s + d.value; }, 0);
	if (total === 0) { el.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;font-size:10px;">No data</div>'; return; }
	var r = (size - 16) / 2, c = 2 * Math.PI * r, ct = size / 2, cum = 0;
	var s = '<div style="position:relative;width:' + size + 'px;height:' + size + 'px;">';
	s += '<svg width="' + size + '" height="' + size + '" style="transform:rotate(-90deg);">';
	s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="#f1f5f9" stroke-width="14"/>';
	data.forEach(function (item) {
		var pct = item.value / total, adj = Math.max(0, pct - 0.02);
		var dash = c * adj + ' ' + (c * (1 - adj)), off = -c * cum;
		cum += pct;
		s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="' + item.color + '" stroke-width="14" stroke-dasharray="' + dash + '" stroke-dashoffset="' + off + '" stroke-linecap="round"><title>' + item.label + ': ' + sd_n(item.value) + '</title></circle>';
	});
	s += '</svg>';
	s += '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;"><span style="font-size:18px;font-weight:800;color:#1e293b;">' + total.toLocaleString() + '</span><span style="font-size:8px;font-weight:700;text-transform:uppercase;color:#94a3b8;">Total</span></div></div>';
	s += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;justify-content:center;">';
	data.forEach(function (item) {
		s += '<div style="display:flex;align-items:center;gap:4px;"><div style="width:7px;height:7px;border-radius:50%;background:' + item.color + ';"></div><span style="font-size:9px;font-weight:600;color:#64748b;">' + item.label + '</span><span style="font-size:9px;font-weight:700;color:' + item.color + ';">' + sd_n(item.value) + '</span></div>';
	});
	s += '</div>';
	el.innerHTML = s;
}

/* ═══════════ RING ═══════════ */

function sd_ring(el, pct, c1, c2, sz) {
	sz = sz || 100; pct = Math.min(100, Math.max(0, pct));
	var r = (sz - 10) / 2, circ = 2 * Math.PI * r, ct = sz / 2;
	var s = '<div style="position:relative;width:' + sz + 'px;height:' + sz + 'px;">';
	s += '<svg viewBox="0 0 ' + sz + ' ' + sz + '" width="' + sz + '" height="' + sz + '" style="transform:rotate(-90deg);">';
	s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="#f1f5f9" stroke-width="7"/>';
	s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="url(#sdring)" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + (circ * pct / 100) + ' ' + (circ * (1 - pct / 100)) + '"/>';
	s += '<defs><linearGradient id="sdring"><stop offset="0%" stop-color="' + (c1 || '#3b82f6') + '"/><stop offset="100%" stop-color="' + (c2 || '#7c3aed') + '"/></linearGradient></defs>';
	s += '</svg>';
	s += '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;"><span style="font-size:20px;font-weight:800;color:#1e293b;">' + Math.round(pct) + '%</span><span style="font-size:7px;font-weight:700;text-transform:uppercase;color:#94a3b8;">reserved</span></div></div>';
	el.innerHTML = s;
}

/* ═══════════ STACKED BAR ═══════════ */

function sd_stacked_bars(el, labels, series) {
	// series: [{name, values:[], color}]
	if (!labels || !labels.length) { el.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;">No data</div>'; return; }
	var W = 400, H = 180, P = { t: 10, r: 10, b: 30, l: 50 };
	var cw = W - P.l - P.r, ch = H - P.t - P.b;
	var maxStack = labels.map(function (_, i) { return series.reduce(function (s, ser) { return s + (ser.values[i] || 0); }, 0); });
	var mx = Math.max.apply(null, maxStack) * 1.1 || 1;
	var barW = Math.min(cw / labels.length * 0.5, 36);

	var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:' + H + 'px;">';
	for (var g = 0; g <= 4; g++) {
		var gy = P.t + (g / 4) * ch;
		s += '<line x1="' + P.l + '" y1="' + gy + '" x2="' + (W - P.r) + '" y2="' + gy + '" stroke="#e2e8f0" stroke-width="0.5"/>';
		s += '<text x="' + (P.l - 6) + '" y="' + (gy + 3) + '" text-anchor="end" fill="#94a3b8" font-size="8" font-weight="600">' + sd_k(mx * (1 - g / 4)) + '</text>';
	}
	labels.forEach(function (l, i) {
		var cx = P.l + (i + 0.5) * (cw / labels.length);
		var cumY = 0;
		series.forEach(function (ser) {
			var v = ser.values[i] || 0;
			var h = (v / mx) * ch;
			var y = P.t + ch - cumY - h;
			s += '<rect x="' + (cx - barW / 2) + '" y="' + y + '" width="' + barW + '" height="' + Math.max(1, h) + '" fill="' + ser.color + '" rx="2" opacity="0.85"><title>' + l + '\n' + ser.name + ': ' + sd_n(v) + '</title></rect>';
			cumY += h;
		});
		s += '<text x="' + cx + '" y="' + (H - 10) + '" text-anchor="middle" fill="#64748b" font-size="8" font-weight="700">' + l + '</text>';
	});
	s += '</svg>';
	// Legend
	s += '<div style="display:flex;gap:12px;justify-content:center;margin-top:6px;">';
	series.forEach(function (ser) {
		s += '<div style="display:flex;align-items:center;gap:4px;"><div style="width:8px;height:8px;border-radius:2px;background:' + ser.color + ';"></div><span style="font-size:9px;font-weight:600;color:#64748b;">' + ser.name + '</span></div>';
	});
	s += '</div>';
	el.innerHTML = s;
}

/* ═══════════ DATA LOADING ═══════════ */

function load_all() {
	var co = window.sd_company;
	var tag = document.getElementById('sd-filter-tag');
	if (co === 'All') { tag.textContent = 'All Companies'; tag.style.background = '#eff6ff'; tag.style.color = '#3b82f6'; }
	else { tag.textContent = co; tag.style.background = '#ecfdf5'; tag.style.color = '#059669'; }

	var args = { company: co };

	// Clear all
	$('#sd-kpis').html('<div style="text-align:center;padding:20px;color:#94a3b8;font-size:10px;grid-column:1/-1;">Loading...</div>');
	$('#sd-chart-company,#sd-chart-wh,#sd-neg-alerts').html('<div style="text-align:center;padding:20px;color:#94a3b8;font-size:10px;">Loading...</div>');
	$('#sd-company-list,#sd-item-table,#sd-swastik-kpis,#sd-swastik-company,#sd-swastik-item,#sd-swastik-detail').html('<div style="text-align:center;padding:20px;color:#94a3b8;font-size:10px;">Loading...</div>');

	/* ── KPIs ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.stock_dashboard.stock_dashboard.get_stock_kpis',
		args: args,
		callback: function (r) {
			if (!r.message) return;
			var d = r.message;
			var kpiHtml = '';
			[
				{ val: sd_n(d.available_stock || d.available_qty) + ' L', lbl: 'Available Stock', icon: '📦', bg: '#ede9fe', color: '#7c3aed', route: "List','Bin',{warehouse:['like','Available WH%']}" },
				{ val: sd_n(d.reserved_stock || d.reserved_qty) + ' L', lbl: 'Swastik Reserved', icon: '🔒', bg: '#fef3c7', color: '#d97706', route: "List','Stock Reservation',{status:'Reserved'}" },
				{ val: d.items_count, lbl: 'Items in Stock', icon: '📋', bg: '#dbeafe', color: '#3b82f6', route: "List','Item'" },
				{ val: d.warehouse_count, lbl: 'Active Warehouses', icon: '🏭', bg: '#d1fae5', color: '#059669', route: "List','Warehouse'" },
				{ val: d.negative_count, lbl: 'Negative Alerts', icon: '⚠', bg: '#fef2f2', color: '#dc2626', route: "List','Bin',{actual_qty:['<',0]}" }
			].forEach(function (k) {
				kpiHtml += '<div class="sd-kpi" onclick="frappe.set_route(\'' + k.route + '\')">';
				kpiHtml += '<div class="sd-kpi-icon" style="background:' + k.bg + ';color:' + k.color + ';">' + k.icon + '</div>';
				kpiHtml += '<div><div class="sd-kpi-val" style="color:' + k.color + ';">--</div>';
				kpiHtml += '<div class="sd-kpi-lbl">' + k.lbl + '</div></div></div>';
			});
			$('#sd-kpis').html(kpiHtml);

			// Animate values
			setTimeout(function () {
				var els = $('#sd-kpis .sd-kpi-val');
				els.eq(0).text(sd_n(d.available_stock || d.available_qty) + ' L');
				els.eq(1).text(sd_n(d.reserved_stock || d.reserved_qty) + ' L');
				els.eq(2).text(d.items_count);
				els.eq(3).text(d.warehouse_count);
				els.eq(4).text(d.negative_count);
			}, 1300);

			// Utilization ring in first chart placeholder
			sd_ring(document.getElementById('sd-chart-wh'), d.utilization_pct || 0, '#3b82f6', '#7c3aed');
		}
	});

	/* ── Stock by Company chart ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.stock_dashboard.stock_dashboard.get_stock_by_company',
		args: args,
		callback: function (r) {
			if (!r.message || !r.message.length) { $('#sd-chart-company').html('<div style="text-align:center;padding:30px;color:#94a3b8;">No data</div>'); return; }
			var labels = r.message.map(function (d) { return d.company.replace(' Enterprise', '').replace(' Export', ''); });
			sd_stacked_bars(document.getElementById('sd-chart-company'), labels, [
				{ name: 'Available', values: r.message.map(function (d) { return d.avail_qty; }), color: '#3b82f6' },
				{ name: 'Reserved', values: r.message.map(function (d) { return d.reserved_qty; }), color: '#f59e0b' }
			]);
		}
	});

	/* ── Negative alerts ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.stock_dashboard.stock_dashboard.get_negative_stock',
		args: args,
		callback: function (r) {
			if (!r.message || !r.message.length) { $('#sd-neg-alerts').html('<div style="text-align:center;padding:20px;color:#059669;font-weight:600;">✓ All clear — no negative stock</div>'); return; }
			var h = '<table class="sd-table"><thead><tr><th>Company</th><th>Warehouse</th><th>Item</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Value</th></tr></thead><tbody>';
			r.message.forEach(function (row) {
				h += '<tr onclick="frappe.set_route(\'Form\',\'Bin\',\'' + row.warehouse + '/' + row.item_code + '\')">';
				h += '<td><span class="sd-badge" style="color:#0891b2;background:#ecfeff;">' + (row.company || '') + '</span></td>';
				h += '<td>' + (row.warehouse || '') + '</td>';
				h += '<td style="font-weight:700;">' + (row.item_code || '') + '</td>';
				h += '<td style="text-align:right;font-weight:800;color:#dc2626;">' + sd_n(row.actual_qty) + '</td>';
				h += '<td style="text-align:right;font-weight:700;color:#dc2626;">' + sd_k(row.stock_value) + '</td></tr>';
			});
			h += '</tbody></table>';
			$('#sd-neg-alerts').html(h);
		}
	});

	/* ── By Company view ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.stock_dashboard.stock_dashboard.get_stock_by_warehouse',
		args: args,
		callback: function (r) {
			if (!r.message || !r.message.length) { $('#sd-company-list').html('<div style="text-align:center;padding:30px;color:#94a3b8;">No warehouse data</div>'); return; }
			// Group by company
			var companies = {};
			r.message.forEach(function (wh) {
				if (!companies[wh.company]) companies[wh.company] = { warehouses: [], total_qty: 0, total_value: 0 };
				companies[wh.company].warehouses.push(wh);
				companies[wh.company].total_qty += wh.total_qty;
				companies[wh.company].total_value += wh.total_value;
			});

			var colors = { 'Geeta Enterprise': { bg: '#eff6ff', accent: '#3b82f6', abbr: 'GE' }, 'Global Export': { bg: '#ecfdf5', accent: '#10b981', abbr: 'GEX' }, 'Shubham Enterprise': { bg: '#fef3c7', accent: '#f59e0b', abbr: 'SHE' } };
			var html = '';
			Object.keys(companies).forEach(function (co) {
				var c = companies[co];
				var style = colors[co] || { bg: '#f8fafc', accent: '#64748b', abbr: co.substring(0, 3).toUpperCase() };

				html += '<div class="sd-co-card" style="border-left:4px solid ' + style.accent + ';">';
				html += '<div class="sd-co-header">';
				html += '<div class="sd-co-name" style="color:' + style.accent + ';">' + style.abbr + '<span style="font-size:11px;font-weight:600;color:#64748b;margin-left:6px;">' + co + '</span></div>';
				html += '<div class="sd-co-stats">';
				html += '<div class="sd-co-stat">Qty<span style="color:' + style.accent + ';">' + sd_n(c.total_qty) + ' L</span></div>';
				html += '<div class="sd-co-stat">Value<span style="color:' + style.accent + ';">' + sd_k(c.total_value) + '</span></div>';
				html += '<div class="sd-co-stat">Warehouses<span>' + c.warehouses.length + '</span></div>';
				html += '</div></div>';

				c.warehouses.forEach(function (wh) {
					html += '<div class="sd-wh">';
					html += '<div class="sd-wh-head"><span class="sd-wh-name">' + wh.warehouse + '</span>';
					html += '<span class="sd-wh-stats">' + sd_n(wh.total_qty) + ' L · ' + sd_k(wh.total_value) + '</span></div>';
					if (wh.items && wh.items.length) {
						wh.items.forEach(function (item) {
							var qtyColor = item.qty < 0 ? '#dc2626' : '#1e293b';
							html += '<div class="sd-item">';
							html += '<span class="sd-item-name">' + item.item_code + '</span>';
							html += '<span class="sd-item-qty" style="color:' + qtyColor + ';">' + sd_n(item.qty) + '</span>';
							html += '<span class="sd-item-val">' + sd_k(item.stock_value) + '</span></div>';
						});
					}
					html += '</div>';
				});

				html += '</div>';
			});
			$('#sd-company-list').html(html);
		}
	});

	/* ── By Item view ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.stock_dashboard.stock_dashboard.get_stock_by_item',
		args: args,
		callback: function (r) {
			if (!r.message || !r.message.length) { $('#sd-item-table').html('<div style="text-align:center;padding:30px;color:#94a3b8;">No item data</div>'); return; }
			var allCos = {};
			r.message.forEach(function (item) { Object.keys(item.companies).forEach(function (co) { allCos[co] = 1; }); });
			var coList = Object.keys(allCos).sort();

			var h = '<table class="sd-table"><thead><tr><th>Item</th>';
			coList.forEach(function (co) { h += '<th colspan="2" style="text-align:center;">' + co.replace(' Enterprise', '').replace(' Export', '') + '</th>'; });
			h += '<th colspan="2" style="text-align:center;background:#eff6ff;">Total</th></tr><tr><th></th>';
			coList.forEach(function () { h += '<th style="text-align:right;">Qty</th><th style="text-align:right;">Value</th>'; });
			h += '<th style="text-align:right;background:#eff6ff;">Qty</th><th style="text-align:right;background:#eff6ff;">Value</th></tr></thead><tbody>';

			r.message.forEach(function (item) {
				h += '<tr>';
				h += '<td style="font-weight:700;color:#1e293b;">' + item.item_code + '</td>';
				coList.forEach(function (co) {
					if (item.companies[co]) {
						var q = item.companies[co].qty;
						var qc = q < 0 ? 'color:#dc2626;font-weight:800;' : '';
						h += '<td style="text-align:right;' + qc + '">' + sd_n(q) + '</td>';
						h += '<td style="text-align:right;">' + sd_k(item.companies[co].value) + '</td>';
					} else {
						h += '<td style="text-align:right;color:#e2e8f0;">-</td><td style="text-align:right;color:#e2e8f0;">-</td>';
					}
				});
				var tqc = item.total_qty < 0 ? 'color:#dc2626;font-weight:800;' : '';
				h += '<td style="text-align:right;background:#f8fafc;' + tqc + '">' + sd_n(item.total_qty) + '</td>';
				h += '<td style="text-align:right;background:#f8fafc;font-weight:700;">' + sd_k(item.total_value) + '</td>';
				h += '</tr>';
			});
			h += '</tbody></table>';
			$('#sd-item-table').html(h);
		}
	});

	/* ── Swastik Reserved ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.stock_dashboard.stock_dashboard.get_swastik_detail',
		args: args,
		callback: function (r) {
			if (!r.message) return;
			var d = r.message;

			// KPIs
			var kpiHtml = '';
			[
				{ val: sd_n(d.total_qty) + ' L', lbl: 'Total Reserved', icon: '🔒', bg: '#fef3c7', color: '#d97706' },
				{ val: sd_k(d.total_value), lbl: 'Total Value', icon: '₹', bg: '#ecfdf5', color: '#059669' },
				{ val: d.companies_count, lbl: 'Companies', icon: '🏢', bg: '#dbeafe', color: '#3b82f6' },
				{ val: d.items_count, lbl: 'Items Reserved', icon: '📦', bg: '#ede9fe', color: '#7c3aed' }
			].forEach(function (k) {
				kpiHtml += '<div class="sd-kpi">';
				kpiHtml += '<div class="sd-kpi-icon" style="background:' + k.bg + ';color:' + k.color + ';">' + k.icon + '</div>';
				kpiHtml += '<div><div class="sd-kpi-val" style="color:' + k.color + ';">' + k.val + '</div>';
				kpiHtml += '<div class="sd-kpi-lbl">' + k.lbl + '</div></div></div>';
			});
			$('#sd-swastik-kpis').html(kpiHtml);

			// By company table
			if (d.by_company && d.by_company.length) {
				var ch = '<table class="sd-table"><thead><tr><th>Company</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Value</th><th style="width:120px;">Share</th></tr></thead><tbody>';
				var maxCo = d.by_company[0].qty || 1;
				d.by_company.forEach(function (row) {
					var pct = (row.qty / maxCo) * 100;
					ch += '<tr>';
					ch += '<td style="font-weight:700;color:#1e293b;">' + (row.company || '') + '</td>';
					ch += '<td style="text-align:right;font-weight:800;color:#d97706;">' + sd_n(row.qty) + '</td>';
					ch += '<td style="text-align:right;font-weight:700;color:#059669;">' + sd_k(row.val) + '</td>';
					ch += '<td><div class="sd-prog"><div class="sd-prog-fill" style="width:' + pct + '%;background:linear-gradient(90deg,#f59e0b,#fbbf24);"></div></div></td>';
					ch += '</tr>';
				});
				ch += '</tbody></table>';
				$('#sd-swastik-company').html(ch);
			}

			// By item table
			if (d.by_item && d.by_item.length) {
				var ih = '<table class="sd-table"><thead><tr><th>Item</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Value</th><th style="width:120px;">Share</th></tr></thead><tbody>';
				var maxIt = d.by_item[0].qty || 1;
				d.by_item.forEach(function (row) {
					var pct = (row.qty / maxIt) * 100;
					ih += '<tr>';
					ih += '<td style="font-weight:700;color:#1e293b;">' + (row.item_code || '') + '</td>';
					ih += '<td style="text-align:right;font-weight:800;color:#d97706;">' + sd_n(row.qty) + '</td>';
					ih += '<td style="text-align:right;font-weight:700;color:#059669;">' + sd_k(row.val) + '</td>';
					ih += '<td><div class="sd-prog"><div class="sd-prog-fill" style="width:' + pct + '%;background:linear-gradient(90deg,#7c3aed,#a78bfa);"></div></div></td>';
					ih += '</tr>';
				});
				ih += '</tbody></table>';
				$('#sd-swastik-item').html(ih);
			}

			// Detail table
			if (d.detail && d.detail.length) {
				var dh = '<table class="sd-table"><thead><tr><th>Company</th><th>Item</th><th>Warehouse</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Value</th></tr></thead><tbody>';
				d.detail.forEach(function (row) {
					dh += '<tr>';
					dh += '<td><span class="sd-badge" style="color:#0891b2;background:#ecfeff;">' + (row.company || '') + '</span></td>';
					dh += '<td style="font-weight:700;">' + (row.item_code || '') + '</td>';
					dh += '<td style="font-size:10px;color:#94a3b8;">' + (row.warehouse || '') + '</td>';
					dh += '<td style="text-align:right;font-weight:800;color:#d97706;">' + sd_n(row.qty) + '</td>';
					dh += '<td style="text-align:right;font-weight:700;color:#059669;">' + sd_k(row.val) + '</td></tr>';
				});
				dh += '</tbody></table>';
				$('#sd-swastik-detail').html(dh);
			}
		}
	});
}
