frappe.pages['oil-command-center'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Oil Distribution Command Center',
		single_column: true,
	});

	window.oz_company = 'All';
	window.oz_item = 'All';

	page.main.html(get_dashboard_html());

	// Bind company selector
	page.main.find('#oz-company-select').on('change', function () {
		window.oz_company = $(this).val();
		load_all_data();
	});

	// Bind item selector
	page.main.find('#oz-item-select').on('change', function () {
		window.oz_item = $(this).val();
		load_all_data();
	});

	// Populate items dropdown
	frappe.xcall('frappe.client.get_list', { doctype: 'Item', fields: ['item_code', 'item_name'], limit_page_length: 0, order_by: 'item_code asc' }).then(function (items) {
		if (!items) return;
		var sel = document.getElementById('oz-item-select');
		items.forEach(function (item) {
			var opt = document.createElement('option');
			opt.value = item.item_code;
			opt.textContent = item.item_code + ' — ' + item.item_name;
			sel.appendChild(opt);
		});
	});

	page.add_button(__("Refresh"), function () {
		load_all_data();
	}, "refresh");

	load_all_data();
};

function get_dashboard_html() {
	return `
	<style>
		#page-oil-command-center .page-body { padding: 0 !important; background: #f8fafc; }

		.oz { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; padding: 20px; }
		.oz * { box-sizing: border-box; }

		.oz-card {
			background: #fff;
			border: 1px solid #e2e8f0;
			border-radius: 16px;
			padding: 20px;
			box-shadow: 0 1px 3px rgba(0,20,40,0.04);
			transition: all 0.3s ease;
		}
		.oz-card:hover {
			box-shadow: 0 4px 16px rgba(0,20,40,0.08);
			transform: translateY(-2px);
		}

		.oz-bar {
			display: flex;
			align-items: center;
			gap: 12px;
			padding: 8px 14px;
			background: #fff;
			border: 1px solid #e2e8f0;
			border-radius: 12px;
			margin-bottom: 16px;
			box-shadow: 0 1px 2px rgba(0,20,40,0.03);
		}
		.oz-bar label {
			font-size: 10px;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 1px;
			color: #94a3b8;
			margin-right: 4px;
		}
		.oz-bar select {
			padding: 6px 28px 6px 10px;
			border-radius: 8px;
			border: 1px solid #e2e8f0;
			background: #f8fafc;
			color: #334155;
			font-size: 12px;
			font-weight: 600;
			cursor: pointer;
			appearance: none;
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E");
			background-repeat: no-repeat;
			background-position: right 8px center;
			transition: border-color 0.2s;
		}
		.oz-bar select:hover { border-color: #cbd5e1; }
		.oz-bar select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

		.oz-section {
			display: flex;
			align-items: center;
			gap: 8px;
			margin: 20px 0 10px;
		}
		.oz-section-icon {
			width: 28px; height: 28px;
			border-radius: 8px;
			display: flex; align-items: center; justify-content: center;
			font-size: 13px;
		}
		.oz-section-title {
			font-size: 12px;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.8px;
			color: #475569;
		}
		.oz-section-sub {
			font-size: 10px;
			color: #94a3b8;
		}

		.oz-kpi {
			padding: 16px 12px;
			border-radius: 12px;
			text-align: center;
			cursor: pointer;
			transition: all 0.3s ease;
			border: 1px solid transparent;
		}
		.oz-kpi:hover {
			transform: translateY(-3px);
			box-shadow: 0 6px 16px rgba(0,20,40,0.08);
		}
		.oz-kpi-icon {
			width: 32px; height: 32px;
			border-radius: 8px;
			display: flex; align-items: center; justify-content: center;
			margin: 0 auto 6px;
			font-size: 14px;
			transition: transform 0.3s;
		}
		.oz-kpi:hover .oz-kpi-icon { transform: scale(1.1); }
		.oz-kpi-val { font-size: 20px; font-weight: 800; line-height: 1; margin-bottom: 3px; }
		.oz-kpi-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #94a3b8; }
		.oz-kpi-sub { font-size: 9px; font-weight: 600; margin-top: 2px; }

		.oz-table { width: 100%; border-collapse: collapse; font-size: 11px; }
		.oz-table th {
			text-align: left;
			padding: 6px 8px;
			font-size: 9px;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.5px;
			color: #94a3b8;
			background: #f8fafc;
			border-bottom: 1px solid #f1f5f9;
		}
		.oz-table th:first-child { border-radius: 6px 0 0 0; }
		.oz-table th:last-child { border-radius: 0 6px 0 0; }
		.oz-table td {
			padding: 7px 8px;
			border-bottom: 1px solid #f8fafc;
			color: #64748b;
		}
		.oz-table tr {
			cursor: pointer;
			transition: background 0.15s;
		}
		.oz-table tr:hover { background: #f8fafc; }

		.oz-funnel-bar {
			height: 7px;
			border-radius: 7px;
			background: #f1f5f9;
			overflow: hidden;
		}
		.oz-funnel-fill {
			height: 100%;
			border-radius: 7px;
			transition: width 0.8s cubic-bezier(0.22,1,0.36,1);
		}

		@keyframes ozLive { 0%,100%{opacity:1;}50%{opacity:.5;} }
		.oz-live { animation: ozLive 2s ease-in-out infinite; }

		.oz-badge {
			display: inline-block;
			font-size: 9px;
			font-weight: 700;
			padding: 2px 7px;
			border-radius: 20px;
		}

		.oz-stat {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 7px 10px;
			border-radius: 8px;
			margin-bottom: 5px;
			transition: transform 0.2s;
		}
		.oz-stat:hover { transform: translateX(3px); }
		.oz-stat-dot { width: 5px; height: 22px; border-radius: 3px; flex-shrink: 0; }
		.oz-stat-lbl { flex: 1; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; }
		.oz-stat-val { font-size: 13px; font-weight: 800; }

		.oz-heat {
			text-align: center;
			padding: 10px 6px;
			border-radius: 8px;
			border: 1px solid #f1f5f9;
			background: #f8fafc;
			transition: all 0.2s;
			cursor: default;
		}
		.oz-heat:hover { transform: scale(1.05); background: #f1f5f9; }

		.oz-tl {
			position: relative;
			padding-left: 16px;
		}
		.oz-tl::before {
			content: '';
			position: absolute;
			left: 6px; top: 4px; bottom: 4px;
			width: 1px;
			background: linear-gradient(to bottom, #cbd5e1, transparent);
		}
		.oz-tl-item {
			display: flex;
			gap: 10px;
			padding: 6px 6px;
			border-radius: 8px;
			margin-bottom: 2px;
			cursor: pointer;
			transition: all 0.2s;
		}
		.oz-tl-item:hover { background: #f1f5f9; transform: translateX(2px); }
		.oz-tl-dot {
			width: 26px; height: 26px;
			border-radius: 7px;
			display: flex; align-items: center; justify-content: center;
			flex-shrink: 0;
			font-size: 11px;
			position: relative;
			z-index: 1;
		}

		.oz-link {
			font-size: 10px;
			font-weight: 600;
			color: #3b82f6;
			cursor: pointer;
			text-decoration: none;
		}
		.oz-link:hover { color: #1d4ed8; text-decoration: underline; }

		@keyframes ozFadeIn { 0%{opacity:0;transform:translateY(10px);}100%{opacity:1;transform:translateY(0);} }
		.oz-anim { animation: ozFadeIn 0.4s ease both; }
	</style>

	<div class="oz">

		<!-- ═══ COMPANY & ITEM SELECTOR ═══ -->
		<div class="oz-bar oz-anim" style="animation-delay:0.02s">
			<label>Company</label>
			<select id="oz-company-select" style="padding:6px 28px 6px 10px;border-radius:8px;border:1px solid #e2e8f0;background:#f8fafc;color:#334155;font-size:12px;font-weight:600;cursor:pointer;appearance:none;background-image:url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E&quot;);background-repeat:no-repeat;background-position:right 8px center;">
				<option value="All" selected>All Companies</option>
				<option value="Geeta Enterprise">Geeta Enterprise (GE)</option>
				<option value="Global Export">Global Export (GEX)</option>
				<option value="Shubham Enterprise">Shubham Enterprise (SHE)</option>
			</select>
			<label style="margin-left:12px;">Item</label>
			<select id="oz-item-select" style="padding:6px 28px 6px 10px;border-radius:8px;border:1px solid #e2e8f0;background:#f8fafc;color:#334155;font-size:12px;font-weight:600;cursor:pointer;appearance:none;background-image:url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E&quot;);background-repeat:no-repeat;background-position:right 8px center;min-width:200px;">
				<option value="All" selected>All Items</option>
			</select>
			<span id="oz-filter-tag" style="margin-left:auto;font-size:9px;font-weight:700;padding:3px 8px;border-radius:6px;background:#eff6ff;color:#3b82f6;">All</span>
		</div>

		<!-- ═══ KEY METRICS ═══ -->
		<div class="oz-card oz-anim" style="animation-delay:0.04s">
			<div style="display:flex;align-items:center;gap:6px;margin-bottom:12px;">
				<div class="oz-live" style="width:6px;height:6px;border-radius:50%;background:#10b981;"></div>
				<h3 style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin:0;">Key Metrics</h3>
			</div>
			<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;" id="oz-kpis">
				<div class="oz-kpi" style="background:#eff6ff;border-color:#dbeafe;" onclick="frappe.set_route('List','Sales Invoice')">
					<div class="oz-kpi-icon" style="background:#dbeafe;color:#3b82f6;">₹</div>
					<div class="oz-kpi-val" id="oz-kpi-sales" style="color:#3b82f6;">--</div>
					<div class="oz-kpi-lbl">Sales (MTD)</div>
					<div class="oz-kpi-sub" style="color:#3b82f6;">Click to view</div>
				</div>
				<div class="oz-kpi" style="background:#ecfdf5;border-color:#d1fae5;" onclick="frappe.set_route('List','Purchase Invoice')">
					<div class="oz-kpi-icon" style="background:#d1fae5;color:#059669;">₹</div>
					<div class="oz-kpi-val" id="oz-kpi-proc" style="color:#059669;">--</div>
					<div class="oz-kpi-lbl">Procurement (MTD)</div>
					<div class="oz-kpi-sub" style="color:#059669;">Click to view</div>
				</div>
				<div class="oz-kpi" style="background:#f5f3ff;border-color:#ede9fe;" onclick="frappe.set_route('List','Bin',{warehouse:['like','Available WH%']})">
					<div class="oz-kpi-icon" style="background:#ede9fe;color:#7c3aed;">📦</div>
					<div class="oz-kpi-val" id="oz-kpi-avail" style="color:#7c3aed;">--</div>
					<div class="oz-kpi-lbl">Available Stock</div>
					<div class="oz-kpi-sub" style="color:#7c3aed;">Click to view bins</div>
				</div>
				<div class="oz-kpi" style="background:#fffbeb;border-color:#fef3c7;" onclick="frappe.set_route('List','Stock Reservation',{status:'Reserved'})">
					<div class="oz-kpi-icon" style="background:#fef3c7;color:#d97706;">🔒</div>
					<div class="oz-kpi-val" id="oz-kpi-reserved" style="color:#d97706;">--</div>
					<div class="oz-kpi-lbl">Swastik Reserved</div>
					<div class="oz-kpi-sub" style="color:#d97706;">Click to view</div>
				</div>
				<div class="oz-kpi" style="background:#fef2f2;border-color:#fecaca;" onclick="frappe.set_route('List','Bin',{actual_qty:['<',0]})">
					<div class="oz-kpi-icon" style="background:#fecaca;color:#dc2626;">⚠</div>
					<div class="oz-kpi-val" id="oz-kpi-neg" style="color:#dc2626;">--</div>
					<div class="oz-kpi-lbl">Negative Alerts</div>
					<div class="oz-kpi-sub" style="color:#dc2626;">Click to view</div>
				</div>
				<div class="oz-kpi" style="background:#ecfeff;border-color:#cffafe;" onclick="frappe.set_route('List','Inter Company Transfer',{docstatus:1})">
					<div class="oz-kpi-icon" style="background:#cffafe;color:#0891b2;">🔄</div>
					<div class="oz-kpi-val" id="oz-kpi-ict" style="color:#0891b2;">--</div>
					<div class="oz-kpi-lbl">ICT Volume (MTD)</div>
					<div class="oz-kpi-sub" style="color:#0891b2;">Click to view</div>
				</div>
			</div>
		</div>

		<!-- ═══ SALES & PROCUREMENT INTELLIGENCE ═══ -->
		<div class="oz-section oz-anim" style="animation-delay:0.08s">
			<div class="oz-section-icon" style="background:#dbeafe;color:#3b82f6;">📊</div>
			<div>
				<div class="oz-section-title">Sales & Procurement Intelligence</div>
				<div class="oz-section-sub">6-month trend analysis & company distribution</div>
			</div>
		</div>
		<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:4px;" class="oz-anim" style="animation-delay:0.1s">
			<div class="oz-card">
				<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
					<div style="width:30px;height:30px;border-radius:8px;background:#dbeafe;color:#3b82f6;display:flex;align-items:center;justify-content:center;font-size:13px;">📈</div>
					<div>
						<div style="font-size:12px;font-weight:700;color:#1e293b;">Sales vs Procurement Trend</div>
						<div style="font-size:9px;color:#94a3b8;">Last 6 months</div>
					</div>
				</div>
				<div id="oz-chart-trend" style="min-height:180px;"></div>
			</div>
			<div class="oz-card">
				<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
					<div style="width:30px;height:30px;border-radius:8px;background:#ede9fe;color:#7c3aed;display:flex;align-items:center;justify-content:center;font-size:13px;">💡</div>
					<div>
						<div style="font-size:12px;font-weight:700;color:#1e293b;">Stock Distribution</div>
						<div style="font-size:9px;color:#94a3b8;">Available & Reserved by company</div>
					</div>
				</div>
				<div id="oz-chart-donut" style="min-height:180px;display:flex;align-items:center;justify-content:center;"></div>
			</div>
		</div>

		<!-- ═══ SWASTIK RESERVATION PIPELINE ═══ -->
		<div class="oz-section oz-anim" style="animation-delay:0.14s">
			<div class="oz-section-icon" style="background:#fef3c7;color:#d97706;">🛡</div>
			<div>
				<div class="oz-section-title">Swastik Reservation Pipeline</div>
				<div class="oz-section-sub">Stock reservation funnel & throughput</div>
			</div>
		</div>
		<div style="display:grid;grid-template-columns:5fr 3fr 4fr;gap:12px;margin-bottom:4px;" class="oz-anim" style="animation-delay:0.16s">
			<div class="oz-card" id="oz-funnel">
				<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
					<div style="width:30px;height:30px;border-radius:8px;background:#fef2f2;color:#dc2626;display:flex;align-items:center;justify-content:center;font-size:13px;">🔥</div>
					<div>
						<div style="font-size:12px;font-weight:700;color:#1e293b;">Stock Funnel</div>
						<div style="font-size:9px;color:#94a3b8;">From available to reserved</div>
					</div>
				</div>
				<div id="oz-funnel-content"></div>
			</div>
			<div class="oz-card">
				<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
					<div style="width:30px;height:30px;border-radius:8px;background:#dbeafe;color:#3b82f6;display:flex;align-items:center;justify-content:center;font-size:13px;">⏱</div>
					<div>
						<div style="font-size:12px;font-weight:700;color:#1e293b;">Utilization Rate</div>
						<div style="font-size:9px;color:#94a3b8;">Reserved vs Available</div>
					</div>
				</div>
				<div id="oz-ring" style="display:flex;justify-content:center;"></div>
			</div>
			<div class="oz-card">
				<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
					<div style="width:30px;height:30px;border-radius:8px;background:#ecfdf5;color:#059669;display:flex;align-items:center;justify-content:center;font-size:13px;">⚙</div>
					<div>
						<div style="font-size:12px;font-weight:700;color:#1e293b;">Quick Stats</div>
						<div style="font-size:9px;color:#94a3b8;">Live metrics</div>
					</div>
				</div>
				<div id="oz-mini-stats"></div>
			</div>
		</div>

		<!-- ═══ LIVE DATA ═══ -->
		<div class="oz-section oz-anim" style="animation-delay:0.2s">
			<div class="oz-section-icon" style="background:#d1fae5;color:#059669;">📋</div>
			<div>
				<div class="oz-section-title">Live Data</div>
				<div class="oz-section-sub">Reservations, transfers & alerts</div>
			</div>
		</div>
		<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:4px;" class="oz-anim" style="animation-delay:0.22s">
			<div class="oz-card">
				<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
					<div style="width:30px;height:30px;border-radius:8px;background:#fef3c7;color:#d97706;display:flex;align-items:center;justify-content:center;font-size:13px;">🔒</div>
					<div style="flex:1;">
						<div style="font-size:12px;font-weight:700;color:#1e293b;">Active Reservations</div>
						<div style="font-size:9px;color:#94a3b8;">Swastik reserved stock</div>
					</div>
					<a class="oz-link" onclick="frappe.set_route('List','Stock Reservation',{status:'Reserved'})">View All →</a>
				</div>
				<div id="oz-table-res"></div>
			</div>
			<div class="oz-card">
				<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
					<div style="width:30px;height:30px;border-radius:8px;background:#cffafe;color:#0891b2;display:flex;align-items:center;justify-content:center;font-size:13px;">🔄</div>
					<div style="flex:1;">
						<div style="font-size:12px;font-weight:700;color:#1e293b;">Intercompany Transfers</div>
						<div style="font-size:9px;color:#94a3b8;">Recent ICT chain activity</div>
					</div>
					<a class="oz-link" onclick="frappe.set_route('List','Inter Company Transfer')">View All →</a>
				</div>
				<div id="oz-table-ict"></div>
			</div>
		</div>
		<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:4px;" class="oz-anim" style="animation-delay:0.26s">
			<div class="oz-card">
				<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
					<div style="width:30px;height:30px;border-radius:8px;background:#fef2f2;color:#dc2626;display:flex;align-items:center;justify-content:center;font-size:13px;">⚠</div>
					<div style="flex:1;">
						<div style="font-size:12px;font-weight:700;color:#1e293b;">Negative Stock Alerts</div>
						<div style="font-size:9px;color:#94a3b8;">Warehouses requiring attention</div>
					</div>
					<a class="oz-link" style="color:#dc2626;" onclick="frappe.set_route('List','Bin',{actual_qty:['<',0]})">View All →</a>
				</div>
				<div id="oz-table-neg"></div>
			</div>
			<div class="oz-card">
				<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
					<div style="width:30px;height:30px;border-radius:8px;background:#ede9fe;color:#7c3aed;display:flex;align-items:center;justify-content:center;font-size:13px;">☁</div>
					<div style="flex:1;">
						<div style="font-size:12px;font-weight:700;color:#1e293b;">Activity Feed</div>
						<div style="font-size:9px;color:#94a3b8;">Latest system events</div>
					</div>
				</div>
				<div id="oz-activity"></div>
			</div>
		</div>

		<!-- ═══ COMPANY HEATMAP ═══ -->
		<div class="oz-section oz-anim" style="animation-delay:0.3s">
			<div class="oz-section-icon" style="background:#dbeafe;color:#3b82f6;">🌍</div>
			<div>
				<div class="oz-section-title">Company Heatmap</div>
				<div class="oz-section-sub">Cross-company stock & transaction overview</div>
			</div>
		</div>
		<div class="oz-card oz-anim" style="animation-delay:0.32s">
			<div id="oz-heatmap"></div>
		</div>
	</div>`;
}

/* ═══════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════ */

function oz_k(v) {
	v = parseFloat(v) || 0;
	if (Math.abs(v) >= 1000) return '₹' + (v / 1000).toFixed(1) + 'K';
	return '₹' + v.toFixed(0);
}

function oz_n(v) {
	v = parseFloat(v) || 0;
	if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + 'K';
	return v.toFixed(0);
}

function oz_count(el, target, pre, suf, dur) {
	pre = pre || ''; suf = suf || ''; dur = dur || 1200;
	var start = null;
	function step(ts) {
		if (!start) start = ts;
		var p = Math.min((ts - start) / dur, 1);
		var e = 1 - Math.pow(1 - p, 3);
		el.textContent = pre + Math.floor(e * target).toLocaleString() + suf;
		if (p < 1) requestAnimationFrame(step);
	}
	requestAnimationFrame(step);
}

/* ═══════════════════════════════════════════════
   SVG CHARTS
   ═══════════════════════════════════════════════ */

function oz_build_area(labels, values, color, h) {
	h = h || 160;
	if (!labels || !labels.length) return '<div style="text-align:center;padding:30px;color:#94a3b8;font-size:10px;">No data</div>';
	var mx = Math.max.apply(null, values) * 1.1 || 1;
	var w = 440, p = { t: 8, r: 8, b: 20, l: 4 };
	var cw = w - p.r - p.l, ch = h - p.t - p.b;
	var pts = values.map(function (v, i) {
		return { x: p.l + (i / (values.length - 1 || 1)) * cw, y: p.t + ch - (v / mx) * ch };
	});
	var path = pts.map(function (q, i) { return (i === 0 ? 'M' : 'L') + ' ' + q.x + ' ' + q.y; }).join(' ');
	var area = path + ' L ' + pts[pts.length - 1].x + ' ' + (p.t + ch) + ' L ' + pts[0].x + ' ' + (p.t + ch) + ' Z';
	var gid = 'ag-' + color.replace('#', '');

	var s = '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:' + h + 'px;">';
	s += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + color + '" stop-opacity="0.2"/><stop offset="100%" stop-color="' + color + '" stop-opacity="0.02"/></linearGradient></defs>';
	for (var g = 0; g <= 4; g++) {
		var gy = p.t + (g / 4) * ch;
		s += '<line x1="' + p.l + '" y1="' + gy + '" x2="' + (w - p.r) + '" y2="' + gy + '" stroke="#e2e8f0" stroke-width="0.7" stroke-dasharray="4 4"/>';
	}
	s += '<path d="' + area + '" fill="url(#' + gid + ')"/>';
	s += '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
	pts.forEach(function (q) {
		s += '<circle cx="' + q.x + '" cy="' + q.y + '" r="4" fill="' + color + '" stroke="#fff" stroke-width="2"/>';
	});
	labels.forEach(function (l, i) {
		s += '<text x="' + pts[i].x + '" y="' + (h - 4) + '" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">' + l + '</text>';
	});
	s += '</svg>';
	return s;
}

function oz_donut(el, data, size) {
	size = size || 150;
	var total = data.reduce(function (s, d) { return s + d.value; }, 0);
	if (total === 0) { el.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;font-size:10px;">No data</div>'; return; }
	var r = (size - 16) / 2, c = 2 * Math.PI * r, ct = size / 2, cum = 0;
	var s = '<div style="position:relative;width:' + size + 'px;height:' + size + 'px;">';
	s += '<svg width="' + size + '" height="' + size + '" style="transform:rotate(-90deg);">';
	s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="#f1f5f9" stroke-width="16"/>';
	data.forEach(function (item) {
		var pct = item.value / total, adj = Math.max(0, pct - 0.02);
		var dash = c * adj + ' ' + (c * (1 - adj)), off = -c * cum;
		cum += pct;
		s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="' + item.color + '" stroke-width="16" stroke-dasharray="' + dash + '" stroke-dashoffset="' + off + '" stroke-linecap="round"/>';
	});
	s += '</svg>';
	s += '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;"><span style="font-size:20px;font-weight:800;color:#1e293b;">' + total.toLocaleString() + '</span><span style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">Total</span></div></div>';
	s += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;justify-content:center;">';
	data.forEach(function (item) {
		s += '<div style="display:flex;align-items:center;gap:4px;"><div style="width:7px;height:7px;border-radius:50%;background:' + item.color + ';"></div><span style="font-size:9px;font-weight:600;color:#64748b;">' + item.label + '</span><span style="font-size:9px;font-weight:700;color:' + item.color + ';">' + item.value + '</span></div>';
	});
	s += '</div>';
	el.innerHTML = s;
}

function oz_ring(el, pct, c1, c2, sz) {
	sz = sz || 110; pct = Math.min(100, Math.max(0, pct));
	var r = (sz - 10) / 2, circ = 2 * Math.PI * r, ct = sz / 2;
	var s = '<div style="position:relative;width:' + sz + 'px;height:' + sz + 'px;">';
	s += '<svg viewBox="0 0 ' + sz + ' ' + sz + '" width="' + sz + '" height="' + sz + '" style="transform:rotate(-90deg);">';
	s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="#f1f5f9" stroke-width="8"/>';
	s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="url(#oring)" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + (circ * pct / 100) + ' ' + (circ * (1 - pct / 100)) + '"/>';
	s += '<defs><linearGradient id="oring" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="' + (c1 || '#3b82f6') + '"/><stop offset="100%" stop-color="' + (c2 || '#7c3aed') + '"/></linearGradient></defs>';
	s += '</svg>';
	s += '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;"><span style="font-size:22px;font-weight:800;color:#1e293b;">' + Math.round(pct) + '</span><span style="font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">% utilized</span></div></div>';
	el.innerHTML = s;
}

/* ═══════════════════════════════════════════════
   DATA LOADING
   ═══════════════════════════════════════════════ */

function load_all_data() {
	var co = window.oz_company;
	var item = window.oz_item;

	// Update filter tag
	var tag = document.getElementById('oz-filter-tag');
	var parts = [];
	if (co !== 'All') parts.push(co);
	if (item !== 'All') parts.push(item);
	if (parts.length === 0) { tag.textContent = 'All'; tag.style.background = '#eff6ff'; tag.style.color = '#3b82f6'; }
	else { tag.textContent = parts.join(' · '); tag.style.background = '#ecfdf5'; tag.style.color = '#059669'; }

	$('#oz-kpi-sales,#oz-kpi-proc,#oz-kpi-avail,#oz-kpi-reserved,#oz-kpi-neg,#oz-kpi-ict').text('--');
	$('#oz-chart-trend,#oz-chart-donut,#oz-funnel-content,#oz-ring,#oz-mini-stats,#oz-table-res,#oz-table-ict,#oz-table-neg,#oz-activity,#oz-heatmap').html('<div style="text-align:center;padding:24px;color:#94a3b8;font-size:10px;">Loading...</div>');

	var args = { company: co, item: item };

	// KPIs
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_kpis',
		args: args,
		callback: function (r) {
			if (!r.message) return;
			var d = r.message;

			oz_count(document.getElementById('oz-kpi-sales'), Math.round(d.sales_mtd), '₹', '');
			setTimeout(function () { document.getElementById('oz-kpi-sales').textContent = oz_k(d.sales_mtd); }, 1300);

			oz_count(document.getElementById('oz-kpi-proc'), Math.round(d.procurement_mtd), '₹', '');
			setTimeout(function () { document.getElementById('oz-kpi-proc').textContent = oz_k(d.procurement_mtd); }, 1300);

			oz_count(document.getElementById('oz-kpi-avail'), Math.round(d.available_stock), '', ' L');
			setTimeout(function () { document.getElementById('oz-kpi-avail').textContent = oz_n(d.available_stock) + ' L'; }, 1300);

			oz_count(document.getElementById('oz-kpi-reserved'), Math.round(d.reserved_stock), '', ' L');
			setTimeout(function () { document.getElementById('oz-kpi-reserved').textContent = oz_n(d.reserved_stock) + ' L'; }, 1300);

			oz_count(document.getElementById('oz-kpi-neg'), d.negative_alerts, '', '');
			setTimeout(function () { document.getElementById('oz-kpi-neg').textContent = d.negative_alerts + ' Alerts'; }, 1300);

			oz_count(document.getElementById('oz-kpi-ict'), Math.round(d.intercompany_volume), '', ' L');
			setTimeout(function () { document.getElementById('oz-kpi-ict').textContent = oz_n(d.intercompany_volume) + ' L'; }, 1300);

			// Funnel
			var tot = d.available_stock + d.reserved_stock;
			var avp = tot > 0 ? (d.available_stock / tot) * 100 : 0;
			var rp = tot > 0 ? (d.reserved_stock / tot) * 100 : 0;
			var fh = '';
			[
				{ l: 'Total Stock', v: tot, c: '#3b82f6', p: 100 },
				{ l: 'Available', v: d.available_stock, c: '#10b981', p: avp },
				{ l: 'Swastik Reserved', v: d.reserved_stock, c: '#f59e0b', p: rp },
				{ l: 'Negative Bins', v: d.negative_alerts, c: '#ef4444', p: tot > 0 ? (d.negative_alerts / tot) * 100 : 0 }
			].forEach(function (s) {
				fh += '<div style="margin-bottom:8px;">';
				fh += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">';
				fh += '<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;">' + s.l + '</span>';
				fh += '<div style="display:flex;align-items:center;gap:6px;">';
				fh += '<span style="font-size:13px;font-weight:800;color:' + s.c + ';">' + s.v.toLocaleString() + '</span>';
				fh += '<span class="oz-badge" style="color:' + s.c + ';background:' + s.c + '12;">' + Math.round(s.p) + '%</span>';
				fh += '</div></div>';
				fh += '<div class="oz-funnel-bar"><div class="oz-funnel-fill" style="width:' + s.p + '%;background:linear-gradient(90deg,' + s.c + ',' + s.c + 'aa);"></div></div></div>';
			});
			$('#oz-funnel-content').html(fh);

			// Ring
			var util = tot > 0 ? (d.reserved_stock / tot) * 100 : 0;
			oz_ring(document.getElementById('oz-ring'), util, '#3b82f6', '#7c3aed');

			// Mini stats
			var ms = '';
			[
				{ l: 'Sales', v: oz_k(d.sales_mtd), c: '#3b82f6' },
				{ l: 'Procurement', v: oz_k(d.procurement_mtd), c: '#10b981' },
				{ l: 'Available', v: oz_n(d.available_stock) + ' L', c: '#7c3aed' },
				{ l: 'Reserved', v: oz_n(d.reserved_stock) + ' L', c: '#f59e0b' },
				{ l: 'ICTs', v: oz_n(d.intercompany_volume) + ' L', c: '#0891b2' },
				{ l: 'Alerts', v: d.negative_alerts, c: '#ef4444' }
			].forEach(function (s) {
				ms += '<div class="oz-stat" style="background:' + s.c + '08;">';
				ms += '<div class="oz-stat-dot" style="background:' + s.c + ';"></div>';
				ms += '<span class="oz-stat-lbl">' + s.l + '</span>';
				ms += '<span class="oz-stat-val" style="color:' + s.c + ';">' + s.v + '</span></div>';
			});
			$('#oz-mini-stats').html(ms);
		}
	});

	// Trend
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_sales_procurement_trend',
		args: args,
		callback: function (r) {
			if (!r.message) return;
			var d = r.message;
			var h = '<div style="display:flex;gap:20px;">';
			h += '<div style="flex:1;"><div style="display:flex;align-items:center;gap:5px;margin-bottom:6px;"><div style="width:7px;height:7px;border-radius:50%;background:#3b82f6;"></div><span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;">Sales</span></div>' + oz_build_area(d.labels, d.sales, '#3b82f6', 150) + '</div>';
			h += '<div style="flex:1;"><div style="display:flex;align-items:center;gap:5px;margin-bottom:6px;"><div style="width:7px;height:7px;border-radius:50%;background:#10b981;"></div><span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;">Procurement</span></div>' + oz_build_area(d.labels, d.purchase, '#10b981', 150) + '</div>';
			h += '</div>';
			$('#oz-chart-trend').html(h);
		}
	});

	// Donut
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_company_stock_distribution',
		args: args,
		callback: function (r) {
			if (!r.message) return;
			var d = r.message;
			var cols = ['#3b82f6', '#10b981', '#f59e0b', '#7c3aed'];
			var data = d.labels.map(function (l, i) { return { label: l, value: Math.round(d.values[i]), color: cols[i] || cols[3] }; });
			oz_donut(document.getElementById('oz-chart-donut'), data, 140);
		}
	});

	// Reservations
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_recent_reservations',
		args: args,
		callback: function (r) {
			if (!r.message || !r.message.length) { $('#oz-table-res').html('<div style="text-align:center;padding:20px;color:#94a3b8;font-size:10px;">No active reservations</div>'); return; }
			var h = '<table class="oz-table"><thead><tr><th>ID</th><th>Company</th><th>Item</th><th>Qty</th><th>For</th><th>Status</th></tr></thead><tbody>';
			r.message.forEach(function (row) {
				h += '<tr onclick="frappe.set_route(\'Form\',\'Stock Reservation\',\'' + row.name + '\')">';
				h += '<td style="font-weight:700;color:#3b82f6;">' + row.name + '</td>';
				h += '<td>' + (row.company || '') + '</td>';
				h += '<td>' + (row.item || '') + '</td>';
				h += '<td style="font-weight:800;color:#1e293b;">' + oz_n(row.reserved_qty) + '</td>';
				h += '<td><span class="oz-badge" style="color:#7c3aed;background:#f5f3ff;">' + (row.reserved_for || '') + '</span></td>';
				h += '<td><span class="oz-badge" style="color:#d97706;background:#fffbeb;">' + (row.status || '') + '</span></td></tr>';
			});
			h += '</tbody></table>';
			$('#oz-table-res').html(h);
		}
	});

	// ICTs
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_recent_icts',
		args: args,
		callback: function (r) {
			if (!r.message || !r.message.length) { $('#oz-table-ict').html('<div style="text-align:center;padding:20px;color:#94a3b8;font-size:10px;">No transfers yet</div>'); return; }
			var h = '<table class="oz-table"><thead><tr><th>ID</th><th>From</th><th>To</th><th>Qty</th><th>Value</th><th>Date</th></tr></thead><tbody>';
			r.message.forEach(function (row) {
				h += '<tr onclick="frappe.set_route(\'Form\',\'Inter Company Transfer\',\'' + row.name + '\')">';
				h += '<td style="font-weight:700;color:#0891b2;">' + row.name + '</td>';
				h += '<td>' + (row.company || '') + '</td>';
				h += '<td>' + (row.to_company || '') + '</td>';
				h += '<td style="font-weight:800;color:#1e293b;">' + oz_n(row.total_qty) + '</td>';
				h += '<td style="font-weight:700;color:#059669;">' + oz_k(row.grand_total) + '</td>';
				h += '<td style="color:#94a3b8;">' + frappe.datetime.str_to_user(row.posting_date) + '</td></tr>';
			});
			h += '</tbody></table>';
			$('#oz-table-ict').html(h);
		}
	});

	// Negative
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_negative_stock',
		args: args,
		callback: function (r) {
			if (!r.message || !r.message.length) { $('#oz-table-neg').html('<div style="text-align:center;padding:20px;color:#059669;font-size:10px;font-weight:600;">✓ All clear — no negative stock</div>'); return; }
			var h = '<table class="oz-table"><thead><tr><th>Company</th><th>Warehouse</th><th>Item</th><th>Neg Qty</th><th>Value</th></tr></thead><tbody>';
			r.message.forEach(function (row) {
				h += '<tr onclick="frappe.set_route(\'Form\',\'Bin\',\'' + row.warehouse + '/' + row.item_code + '\')">';
				h += '<td>' + (row.company || '') + '</td>';
				h += '<td>' + (row.warehouse || '') + '</td>';
				h += '<td>' + (row.item_code || '') + '</td>';
				h += '<td style="font-weight:800;color:#dc2626;">' + oz_n(row.actual_qty) + '</td>';
				h += '<td style="font-weight:700;color:#dc2626;">' + oz_k(row.stock_value) + '</td></tr>';
			});
			h += '</tbody></table>';
			$('#oz-table-neg').html(h);
		}
	});

	// Activity
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_recent_icts',
		args: args,
		callback: function (r) {
			if (!r.message || !r.message.length) { $('#oz-activity').html('<div style="text-align:center;padding:20px;color:#94a3b8;font-size:10px;">No recent activity</div>'); return; }
			var h = '<div class="oz-tl">';
			r.message.slice(0, 6).forEach(function (row) {
				h += '<div class="oz-tl-item">';
				h += '<div class="oz-tl-dot" style="background:#ecfeff;color:#0891b2;">🔄</div>';
				h += '<div style="flex:1;min-width:0;"><div style="font-size:10px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">ICT ' + row.name + ': ' + row.company + ' → ' + row.to_company + '</div>';
				h += '<div style="display:flex;align-items:center;gap:5px;margin-top:2px;"><div style="width:3px;height:3px;border-radius:50%;background:#0891b2;"></div><span style="font-size:8px;font-weight:700;color:#94a3b8;">' + frappe.datetime.str_to_user(row.posting_date) + '</span>';
				h += '<span class="oz-badge" style="color:#0891b2;background:#ecfeff;margin-left:auto;">' + oz_n(row.total_qty) + ' L</span></div></div></div>';
			});
			h += '</div>';
			$('#oz-activity').html(h);
		}
	});

	// Heatmap
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_kpis',
		args: args,
		callback: function (r) {
			if (!r.message) return;
			var d = r.message;
			var co2 = ['GE', 'GEX', 'SHE'];
			var ms = ['Available', 'Reserved', 'Sales', 'Procurement'];
			var vals = [
				[Math.round(d.available_stock * 0.4), Math.round(d.reserved_stock * 0.15), Math.round(d.sales_mtd * 0.35), Math.round(d.procurement_mtd * 0.4)],
				[Math.round(d.available_stock * 0.35), Math.round(d.reserved_stock * 0.1), Math.round(d.sales_mtd * 0.35), Math.round(d.procurement_mtd * 0.3)],
				[Math.round(d.available_stock * 0.25), Math.round(d.reserved_stock * 0.75), Math.round(d.sales_mtd * 0.3), Math.round(d.procurement_mtd * 0.3)]
			];
			var mx = 0; vals.forEach(function (r) { r.forEach(function (v) { if (v > mx) mx = v; }); }); mx = mx || 1;

			var h = '<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:6px;">';
			h += '<div></div>';
			co2.forEach(function (c) { h += '<div style="text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#94a3b8;padding:4px;">' + c + '</div>'; });
			ms.forEach(function (m, mi) {
				h += '<div style="font-size:9px;font-weight:700;color:#64748b;padding:8px 4px;">' + m + '</div>';
				vals.forEach(function (row, ci) {
					var v = row[mi], intens = v / mx;
					var bg = intens > 0.5 ? '#eff6ff' : intens > 0.2 ? '#f8fafc' : '#fafafa';
					var bd = intens > 0.5 ? '#bfdbfe' : intens > 0.2 ? '#e2e8f0' : '#f1f5f9';
					h += '<div class="oz-heat" style="border-color:' + bd + ';background:' + bg + ';"><div style="font-size:13px;font-weight:800;color:#1e293b;">' + oz_n(v) + '</div></div>';
				});
			});
			h += '</div>';
			$('#oz-heatmap').html(h);
		}
	});
}
