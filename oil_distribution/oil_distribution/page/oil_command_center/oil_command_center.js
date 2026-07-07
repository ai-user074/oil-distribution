frappe.pages['oil-command-center'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Oil Distribution Command Center',
		single_column: true,
	});

	window.oz_company = 'All';
	window.oz_item = 'All';
	window.oz_tab = 'sales';

	page.main.html(get_dashboard_html());

	// Tab switching
	page.main.find('.oz-tab-btn').on('click', function () {
		var tab = $(this).data('tab');
		window.oz_tab = tab;
		page.main.find('.oz-tab-btn').removeClass('oz-tab-active');
		$(this).addClass('oz-tab-active');
		page.main.find('.oz-tab-panel').hide();
		page.main.find('#oz-panel-' + tab).show();
	});

	// Company selector
	page.main.find('#oz-company-select').on('change', function () {
		window.oz_company = $(this).val();
		load_all_data();
	});

	// Item selector
	page.main.find('#oz-item-select').on('change', function () {
		window.oz_item = $(this).val();
		load_all_data();
	});

	// Populate items
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

	page.add_button(__("Refresh"), function () { load_all_data(); }, "refresh");
	load_all_data();
};

function get_dashboard_html() {
	return `
	<style>
		#page-oil-command-center .page-body { padding: 0 !important; background: #f0f2f5; }
		.oz { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; padding: 16px 20px; }
		.oz * { box-sizing: border-box; }

		.oz-card {
			background: #fff;
			border: 1px solid #e2e8f0;
			border-radius: 14px;
			padding: 18px;
			box-shadow: 0 1px 3px rgba(0,20,40,0.04);
		}

		/* Filter bar */
		.oz-bar {
			display: flex; align-items: center; gap: 10px;
			padding: 8px 14px; background: #fff; border: 1px solid #e2e8f0;
			border-radius: 12px; margin-bottom: 14px;
		}
		.oz-bar label {
			font-size: 9px; font-weight: 700; text-transform: uppercase;
			letter-spacing: 0.8px; color: #94a3b8;
		}
		.oz-bar select {
			padding: 5px 26px 5px 8px; border-radius: 7px; border: 1px solid #e2e8f0;
			background: #f8fafc; color: #334155; font-size: 11px; font-weight: 600;
			cursor: pointer; appearance: none;
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%2394a3b8'/%3E%3C/svg%3E");
			background-repeat: no-repeat; background-position: right 7px center;
		}
		.oz-bar select:focus { outline: none; border-color: #3b82f6; }

		/* Tabs */
		.oz-tabs {
			display: flex; gap: 2px; margin-bottom: 14px;
			background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
			padding: 4px; width: fit-content;
		}
		.oz-tab-btn {
			padding: 7px 18px; border-radius: 8px; border: none; background: transparent;
			font-size: 11px; font-weight: 700; cursor: pointer;
			color: #94a3b8; transition: all 0.2s;
		}
		.oz-tab-btn:hover { color: #475569; background: #f8fafc; }
		.oz-tab-active { background: #3b82f6 !important; color: #fff !important; }

		/* KPI cards */
		.oz-kpi-row { display: grid; gap: 10px; margin-bottom: 14px; }
		.oz-kpi-row-3 { grid-template-columns: repeat(3, 1fr); }
		.oz-kpi-card {
			background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
			padding: 14px 16px; cursor: pointer; transition: all 0.2s;
			display: flex; align-items: center; gap: 12px;
		}
		.oz-kpi-card:hover { box-shadow: 0 4px 12px rgba(0,20,40,0.08); transform: translateY(-2px); }
		.oz-kpi-icon {
			width: 40px; height: 40px; border-radius: 10px;
			display: flex; align-items: center; justify-content: center;
			font-size: 16px; flex-shrink: 0;
		}
		.oz-kpi-info { flex: 1; min-width: 0; }
		.oz-kpi-val { font-size: 20px; font-weight: 800; line-height: 1.1; }
		.oz-kpi-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-top: 1px; }
		.oz-kpi-sub { font-size: 9px; font-weight: 600; color: #94a3b8; margin-top: 2px; }

		/* Chart card */
		.oz-chart-card {
			background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
			padding: 18px; margin-bottom: 14px;
		}
		.oz-chart-head {
			display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
		}
		.oz-chart-icon {
			width: 30px; height: 30px; border-radius: 8px;
			display: flex; align-items: center; justify-content: center; font-size: 13px;
		}
		.oz-chart-title { font-size: 12px; font-weight: 700; color: #1e293b; }
		.oz-chart-sub { font-size: 9px; color: #94a3b8; }

		/* Table */
		.oz-table { width: 100%; border-collapse: collapse; font-size: 11px; }
		.oz-table th {
			text-align: left; padding: 7px 10px;
			font-size: 9px; font-weight: 700; text-transform: uppercase;
			letter-spacing: 0.5px; color: #94a3b8; background: #f8fafc;
			border-bottom: 1px solid #f1f5f9;
		}
		.oz-table td { padding: 8px 10px; border-bottom: 1px solid #f8fafc; color: #475569; }
		.oz-table tr { cursor: pointer; transition: background 0.15s; }
		.oz-table tr:hover { background: #f1f5f9; }

		.oz-badge {
			display: inline-block; font-size: 9px; font-weight: 700;
			padding: 2px 7px; border-radius: 20px;
		}

		/* Bar chart tooltip */
		.oz-bar-tooltip {
			position: absolute; background: #1e293b; color: #fff;
			padding: 6px 10px; border-radius: 8px; font-size: 10px;
			pointer-events: none; z-index: 100; white-space: nowrap;
			box-shadow: 0 4px 12px rgba(0,0,0,0.15);
			transform: translateX(-50%);
		}
		.oz-bar-tooltip::after {
			content: ''; position: absolute; top: 100%; left: 50%;
			transform: translateX(-50%);
			border: 5px solid transparent; border-top-color: #1e293b;
		}

		/* Two column grid */
		.oz-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
		.oz-grid-3-7 { display: grid; grid-template-columns: 3fr 7fr; gap: 12px; margin-bottom: 14px; }
		.oz-grid-7-3 { display: grid; grid-template-columns: 7fr 3fr; gap: 12px; margin-bottom: 14px; }

		.oz-link {
			font-size: 10px; font-weight: 600; color: #3b82f6;
			cursor: pointer; text-decoration: none;
		}
		.oz-link:hover { text-decoration: underline; }

		/* Funnel bar */
		.oz-funnel-bar { height: 6px; border-radius: 6px; background: #f1f5f9; overflow: hidden; }
		.oz-funnel-fill { height: 100%; border-radius: 6px; transition: width 0.8s cubic-bezier(0.22,1,0.36,1); }

		/* Timeline */
		.oz-tl { position: relative; padding-left: 14px; }
		.oz-tl::before {
			content: ''; position: absolute; left: 5px; top: 4px; bottom: 4px;
			width: 1px; background: linear-gradient(to bottom, #cbd5e1, transparent);
		}
		.oz-tl-item {
			display: flex; gap: 8px; padding: 5px 4px; border-radius: 6px;
			margin-bottom: 2px; cursor: pointer; transition: all 0.15s;
		}
		.oz-tl-item:hover { background: #f1f5f9; }
		.oz-tl-dot {
			width: 22px; height: 22px; border-radius: 6px;
			display: flex; align-items: center; justify-content: center;
			flex-shrink: 0; font-size: 10px; position: relative; z-index: 1;
		}

		@keyframes ozFadeIn { 0%{opacity:0;transform:translateY(8px);}100%{opacity:1;transform:translateY(0);} }
		.oz-anim { animation: ozFadeIn 0.35s ease both; }
	</style>

	<div class="oz">

		<!-- FILTERS -->
		<div class="oz-bar oz-anim">
			<label>Company</label>
			<select id="oz-company-select">
				<option value="All" selected>All Companies</option>
				<option value="Geeta Enterprise">Geeta Enterprise (GE)</option>
				<option value="Global Export">Global Export (GEX)</option>
				<option value="Shubham Enterprise">Shubham Enterprise (SHE)</option>
			</select>
			<label style="margin-left:8px;">Item</label>
			<select id="oz-item-select" style="min-width:180px;">
				<option value="All" selected>All Items</option>
			</select>
			<span id="oz-filter-tag" style="margin-left:auto;font-size:9px;font-weight:700;padding:3px 8px;border-radius:6px;background:#eff6ff;color:#3b82f6;">All</span>
		</div>

		<!-- TABS -->
		<div class="oz-tabs oz-anim" style="animation-delay:0.04s">
			<button class="oz-tab-btn oz-tab-active" data-tab="sales">Sales & Procurement</button>
			<button class="oz-tab-btn" data-tab="stock">Stock Intelligence</button>
			<button class="oz-tab-btn" data-tab="ict">ICT & Reservations</button>
		</div>

		<!-- ═══════════════ PANEL 1: SALES & PROCUREMENT ═══════════════ -->
		<div id="oz-panel-sales" class="oz-tab-panel">

			<!-- KPIs -->
			<div class="oz-kpi-row oz-kpi-row-3 oz-anim" style="animation-delay:0.06s">
				<div class="oz-kpi-card" onclick="frappe.set_route('List','Sales Invoice')">
					<div class="oz-kpi-icon" style="background:#dbeafe;color:#3b82f6;">₹</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-sales" style="color:#3b82f6;">--</div>
						<div class="oz-kpi-lbl">Sales MTD</div>
					</div>
				</div>
				<div class="oz-kpi-card" onclick="frappe.set_route('List','Purchase Invoice')">
					<div class="oz-kpi-icon" style="background:#d1fae5;color:#059669;">₹</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-proc" style="color:#059669;">--</div>
						<div class="oz-kpi-lbl">Procurement MTD</div>
					</div>
				</div>
				<div class="oz-kpi-card" onclick="frappe.set_route('List','Inter Company Transfer',{docstatus:1})">
					<div class="oz-kpi-icon" style="background:#cffafe;color:#0891b2;">🔄</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-ict" style="color:#0891b2;">--</div>
						<div class="oz-kpi-lbl">ICT Volume MTD</div>
					</div>
				</div>
			</div>

			<!-- Interactive Bar Chart -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.1s">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#dbeafe;color:#3b82f6;">📊</div>
					<div>
						<div class="oz-chart-title">Monthly Sales vs Procurement</div>
						<div class="oz-chart-sub">6-month trend · hover bars for details</div>
					</div>
				</div>
				<div id="oz-bar-chart" style="position:relative;min-height:220px;"></div>
			</div>

			<!-- Monthly Breakdown Table -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.14s">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#ecfdf5;color:#059669;">📋</div>
					<div>
						<div class="oz-chart-title">Monthly Breakdown</div>
						<div class="oz-chart-sub">Detailed month-by-month figures</div>
					</div>
				</div>
				<div id="oz-monthly-table"></div>
			</div>
		</div>

		<!-- ═══════════════ PANEL 2: STOCK INTELLIGENCE ═══════════════ -->
		<div id="oz-panel-stock" class="oz-tab-panel" style="display:none;">

			<!-- KPIs -->
			<div class="oz-kpi-row oz-kpi-row-3 oz-anim" style="animation-delay:0.06s">
				<div class="oz-kpi-card" onclick="frappe.set_route('List','Bin',{warehouse:['like','Available WH%']})">
					<div class="oz-kpi-icon" style="background:#ede9fe;color:#7c3aed;">📦</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-avail" style="color:#7c3aed;">--</div>
						<div class="oz-kpi-lbl">Available Stock</div>
					</div>
				</div>
				<div class="oz-kpi-card" onclick="frappe.set_route('List','Stock Reservation',{status:'Reserved'})">
					<div class="oz-kpi-icon" style="background:#fef3c7;color:#d97706;">🔒</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-reserved" style="color:#d97706;">--</div>
						<div class="oz-kpi-lbl">Swastik Reserved</div>
					</div>
				</div>
				<div class="oz-kpi-card" onclick="frappe.set_route('List','Bin',{actual_qty:['<',0]})">
					<div class="oz-kpi-icon" style="background:#fef2f2;color:#dc2626;">⚠</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-neg" style="color:#dc2626;">--</div>
						<div class="oz-kpi-lbl">Negative Alerts</div>
					</div>
				</div>
			</div>

			<div class="oz-grid-7-3 oz-anim" style="animation-delay:0.1s">
				<!-- Stock Funnel -->
				<div class="oz-chart-card" style="margin-bottom:0;">
					<div class="oz-chart-head">
						<div class="oz-chart-icon" style="background:#fef2f2;color:#dc2626;">🔥</div>
						<div>
							<div class="oz-chart-title">Stock Pipeline</div>
							<div class="oz-chart-sub">Available → Reserved → Alerts</div>
						</div>
					</div>
					<div id="oz-funnel-content"></div>
				</div>
				<!-- Utilization Ring + Quick Stats -->
				<div style="display:flex;flex-direction:column;gap:12px;">
					<div class="oz-chart-card" style="margin-bottom:0;flex:1;">
						<div class="oz-chart-head">
							<div class="oz-chart-icon" style="background:#dbeafe;color:#3b82f6;">⏱</div>
							<div>
								<div class="oz-chart-title">Utilization</div>
								<div class="oz-chart-sub">Reserved / Total</div>
							</div>
						</div>
						<div id="oz-ring" style="display:flex;justify-content:center;"></div>
					</div>
					<div class="oz-chart-card" style="margin-bottom:0;">
						<div class="oz-chart-head">
							<div class="oz-chart-icon" style="background:#ecfdf5;color:#059669;">⚡</div>
							<div>
								<div class="oz-chart-title">Quick Stats</div>
							</div>
						</div>
						<div id="oz-mini-stats"></div>
					</div>
				</div>
			</div>

			<!-- Donut + Negative Alerts -->
			<div class="oz-grid-2 oz-anim" style="animation-delay:0.14s">
				<div class="oz-chart-card" style="margin-bottom:0;">
					<div class="oz-chart-head">
						<div class="oz-chart-icon" style="background:#ede9fe;color:#7c3aed;">💡</div>
						<div>
							<div class="oz-chart-title">Stock Distribution</div>
							<div class="oz-chart-sub">By company</div>
						</div>
					</div>
					<div id="oz-chart-donut" style="display:flex;justify-content:center;"></div>
				</div>
				<div class="oz-chart-card" style="margin-bottom:0;">
					<div class="oz-chart-head">
						<div class="oz-chart-icon" style="background:#fef2f2;color:#dc2626;">⚠</div>
						<div style="flex:1;">
							<div class="oz-chart-title">Negative Stock Alerts</div>
							<div class="oz-chart-sub">Requires attention</div>
						</div>
						<a class="oz-link" style="color:#dc2626;" onclick="frappe.set_route('List','Bin',{actual_qty:['<',0]})">View All →</a>
					</div>
					<div id="oz-table-neg"></div>
				</div>
			</div>
		</div>

		<!-- ═══════════════ PANEL 3: ICT & RESERVATIONS ═══════════════ -->
		<div id="oz-panel-ict" class="oz-tab-panel" style="display:none;">

			<!-- KPIs -->
			<div class="oz-kpi-row oz-kpi-row-3 oz-anim" style="animation-delay:0.06s">
				<div class="oz-kpi-card" onclick="frappe.set_route('List','Inter Company Transfer',{docstatus:1})">
					<div class="oz-kpi-icon" style="background:#cffafe;color:#0891b2;">🔄</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-ict2" style="color:#0891b2;">--</div>
						<div class="oz-kpi-lbl">ICT Volume MTD</div>
					</div>
				</div>
				<div class="oz-kpi-card" onclick="frappe.set_route('List','Stock Reservation',{status:'Reserved'})">
					<div class="oz-kpi-icon" style="background:#fef3c7;color:#d97706;">🔒</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-reserved2" style="color:#d97706;">--</div>
						<div class="oz-kpi-lbl">Active Reservations</div>
					</div>
				</div>
				<div class="oz-kpi-card" onclick="frappe.set_route('List','Stock Reservation',{status:'Reserved'})">
					<div class="oz-kpi-icon" style="background:#ede9fe;color:#7c3aed;">📊</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-resqty" style="color:#7c3aed;">--</div>
						<div class="oz-kpi-lbl">Reserved Quantity</div>
					</div>
				</div>
			</div>

			<!-- Reservations Table -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.1s">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#fef3c7;color:#d97706;">🛡</div>
					<div style="flex:1;">
						<div class="oz-chart-title">Active Reservations</div>
						<div class="oz-chart-sub">Swastik reserved stock</div>
					</div>
					<a class="oz-link" onclick="frappe.set_route('List','Stock Reservation',{status:'Reserved'})">View All →</a>
				</div>
				<div id="oz-table-res"></div>
			</div>

			<!-- ICT Table -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.14s">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#cffafe;color:#0891b2;">🔄</div>
					<div style="flex:1;">
						<div class="oz-chart-title">Intercompany Transfers</div>
						<div class="oz-chart-sub">Recent ICT chain activity</div>
					</div>
					<a class="oz-link" onclick="frappe.set_route('List','Inter Company Transfer')">View All →</a>
				</div>
				<div id="oz-table-ict"></div>
			</div>

			<!-- Activity Feed -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.18s">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#ede9fe;color:#7c3aed;">☁</div>
					<div>
						<div class="oz-chart-title">Activity Feed</div>
						<div class="oz-chart-sub">Latest system events</div>
					</div>
				</div>
				<div id="oz-activity"></div>
			</div>
		</div>

	</div>`;
}

/* ═══════════ UTILITIES ═══════════ */

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

/* ═══════════ INTERACTIVE BAR CHART ═══════════ */

function oz_build_bar_chart(container, labels, sales, purchase) {
	if (!labels || !labels.length) {
		container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;font-size:11px;">No data available</div>';
		return;
	}

	var W = 680, H = 210, P = { t: 20, r: 20, b: 36, l: 50 };
	var cw = W - P.l - P.r, ch = H - P.t - P.b;
	var all = sales.concat(purchase);
	var mx = Math.max.apply(null, all) * 1.15 || 1;
	var n = labels.length;
	var groupW = cw / n;
	var barW = Math.min(groupW * 0.3, 32);
	var gap = Math.min(groupW * 0.08, 6);

	var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:' + H + 'px;">';

	// Grid lines
	for (var g = 0; g <= 4; g++) {
		var gy = P.t + (g / 4) * ch;
		var val = Math.round(mx * (1 - g / 4));
		s += '<line x1="' + P.l + '" y1="' + gy + '" x2="' + (W - P.r) + '" y2="' + gy + '" stroke="#e2e8f0" stroke-width="0.7" stroke-dasharray="3 3"/>';
		s += '<text x="' + (P.l - 6) + '" y="' + (gy + 3) + '" text-anchor="end" fill="#94a3b8" font-size="8" font-weight="600">' + oz_k(val) + '</text>';
	}

	// Bars with tooltips
	labels.forEach(function (l, i) {
		var cx = P.l + i * groupW + groupW / 2;
		var sx = cx - barW - gap / 2;
		var px = cx + gap / 2;
		var sv = sales[i] || 0, pv = purchase[i] || 0;
		var sh = (sv / mx) * ch, ph = (pv / mx) * ch;

		// Sales bar
		s += '<rect x="' + sx + '" y="' + (P.t + ch - sh) + '" width="' + barW + '" height="' + sh + '" rx="3" fill="#3b82f6" opacity="0.85" class="oz-bar-rect">';
		s += '<title>' + l + '\nSales: ' + oz_k(sv) + '</title></rect>';

		// Procurement bar
		s += '<rect x="' + px + '" y="' + (P.t + ch - ph) + '" width="' + barW + '" height="' + ph + '" rx="3" fill="#10b981" opacity="0.85" class="oz-bar-rect">';
		s += '<title>' + l + '\nProcurement: ' + oz_k(pv) + '</title></rect>';

		// Month label
		s += '<text x="' + cx + '" y="' + (H - 10) + '" text-anchor="middle" fill="#94a3b8" font-size="9" font-weight="600">' + l + '</text>';
	});

	s += '</svg>';

	// Legend
	s += '<div style="display:flex;gap:16px;justify-content:center;margin-top:8px;">';
	s += '<div style="display:flex;align-items:center;gap:5px;"><div style="width:10px;height:10px;border-radius:3px;background:#3b82f6;"></div><span style="font-size:10px;font-weight:600;color:#64748b;">Sales</span></div>';
	s += '<div style="display:flex;align-items:center;gap:5px;"><div style="width:10px;height:10px;border-radius:3px;background:#10b981;"></div><span style="font-size:10px;font-weight:600;color:#64748b;">Procurement</span></div>';
	s += '</div>';

	container.innerHTML = s;
}

/* ═══════════ SVG CHARTS ═══════════ */

function oz_donut(el, data, size) {
	size = size || 140;
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
		s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="' + item.color + '" stroke-width="14" stroke-dasharray="' + dash + '" stroke-dashoffset="' + off + '" stroke-linecap="round">';
		s += '<title>' + item.label + ': ' + item.value.toLocaleString() + '</title></circle>';
	});
	s += '</svg>';
	s += '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;"><span style="font-size:18px;font-weight:800;color:#1e293b;">' + total.toLocaleString() + '</span><span style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">Total</span></div></div>';
	s += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;justify-content:center;">';
	data.forEach(function (item) {
		s += '<div style="display:flex;align-items:center;gap:4px;"><div style="width:7px;height:7px;border-radius:50%;background:' + item.color + ';"></div><span style="font-size:9px;font-weight:600;color:#64748b;">' + item.label + '</span><span style="font-size:9px;font-weight:700;color:' + item.color + ';">' + oz_n(item.value) + '</span></div>';
	});
	s += '</div>';
	el.innerHTML = s;
}

function oz_ring(el, pct, c1, c2, sz) {
	sz = sz || 100; pct = Math.min(100, Math.max(0, pct));
	var r = (sz - 10) / 2, circ = 2 * Math.PI * r, ct = sz / 2;
	var s = '<div style="position:relative;width:' + sz + 'px;height:' + sz + 'px;">';
	s += '<svg viewBox="0 0 ' + sz + ' ' + sz + '" width="' + sz + '" height="' + sz + '" style="transform:rotate(-90deg);">';
	s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="#f1f5f9" stroke-width="7"/>';
	s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="url(#oring)" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + (circ * pct / 100) + ' ' + (circ * (1 - pct / 100)) + '"/>';
	s += '<defs><linearGradient id="oring" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="' + (c1 || '#3b82f6') + '"/><stop offset="100%" stop-color="' + (c2 || '#7c3aed') + '"/></linearGradient></defs>';
	s += '</svg>';
	s += '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;"><span style="font-size:20px;font-weight:800;color:#1e293b;">' + Math.round(pct) + '%</span></div></div>';
	el.innerHTML = s;
}

/* ═══════════ DATA LOADING ═══════════ */

function load_all_data() {
	var co = window.oz_company;
	var item = window.oz_item;

	var tag = document.getElementById('oz-filter-tag');
	var parts = [];
	if (co !== 'All') parts.push(co);
	if (item !== 'All') parts.push(item);
	if (parts.length === 0) { tag.textContent = 'All'; tag.style.background = '#eff6ff'; tag.style.color = '#3b82f6'; }
	else { tag.textContent = parts.join(' · '); tag.style.background = '#ecfdf5'; tag.style.color = '#059669'; }

	$('#oz-kpi-sales,#oz-kpi-proc,#oz-kpi-avail,#oz-kpi-reserved,#oz-kpi-neg,#oz-kpi-ict,#oz-kpi-ict2,#oz-kpi-reserved2,#oz-kpi-resqty').text('--');
	$('#oz-bar-chart,#oz-monthly-table,#oz-chart-donut,#oz-funnel-content,#oz-ring,#oz-mini-stats,#oz-table-res,#oz-table-ict,#oz-table-neg,#oz-activity').html('<div style="text-align:center;padding:24px;color:#94a3b8;font-size:10px;">Loading...</div>');

	var args = { company: co, item: item };

	/* ── KPIs ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_kpis',
		args: args,
		callback: function (r) {
			if (!r.message) return;
			var d = r.message;

			// Panel 1 KPIs
			oz_count(document.getElementById('oz-kpi-sales'), Math.round(d.sales_mtd), '₹', '');
			setTimeout(function () { document.getElementById('oz-kpi-sales').textContent = oz_k(d.sales_mtd); }, 1300);
			oz_count(document.getElementById('oz-kpi-proc'), Math.round(d.procurement_mtd), '₹', '');
			setTimeout(function () { document.getElementById('oz-kpi-proc').textContent = oz_k(d.procurement_mtd); }, 1300);
			oz_count(document.getElementById('oz-kpi-ict'), Math.round(d.intercompany_volume), '', ' L');
			setTimeout(function () { document.getElementById('oz-kpi-ict').textContent = oz_n(d.intercompany_volume) + ' L'; }, 1300);

			// Panel 2 KPIs
			oz_count(document.getElementById('oz-kpi-avail'), Math.round(d.available_stock), '', ' L');
			setTimeout(function () { document.getElementById('oz-kpi-avail').textContent = oz_n(d.available_stock) + ' L'; }, 1300);
			oz_count(document.getElementById('oz-kpi-reserved'), Math.round(d.reserved_stock), '', ' L');
			setTimeout(function () { document.getElementById('oz-kpi-reserved').textContent = oz_n(d.reserved_stock) + ' L'; }, 1300);
			oz_count(document.getElementById('oz-kpi-neg'), d.negative_alerts, '', '');
			setTimeout(function () { document.getElementById('oz-kpi-neg').textContent = d.negative_alerts + ' Alerts'; }, 1300);

			// Panel 3 KPIs
			oz_count(document.getElementById('oz-kpi-ict2'), Math.round(d.intercompany_volume), '', ' L');
			setTimeout(function () { document.getElementById('oz-kpi-ict2').textContent = oz_n(d.intercompany_volume) + ' L'; }, 1300);

			// Funnel
			var tot = d.available_stock + d.reserved_stock;
			var fh = '';
			[
				{ l: 'Total Stock', v: tot, c: '#3b82f6', p: 100 },
				{ l: 'Available', v: d.available_stock, c: '#10b981', p: tot > 0 ? (d.available_stock / tot) * 100 : 0 },
				{ l: 'Swastik Reserved', v: d.reserved_stock, c: '#f59e0b', p: tot > 0 ? (d.reserved_stock / tot) * 100 : 0 },
				{ l: 'Negative Bins', v: d.negative_alerts, c: '#ef4444', p: tot > 0 ? (d.negative_alerts / tot) * 100 : 0 }
			].forEach(function (s) {
				fh += '<div style="margin-bottom:10px;">';
				fh += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">';
				fh += '<span style="font-size:10px;font-weight:700;color:#64748b;">' + s.l + '</span>';
				fh += '<div style="display:flex;align-items:center;gap:6px;">';
				fh += '<span style="font-size:14px;font-weight:800;color:' + s.c + ';">' + s.v.toLocaleString() + '</span>';
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
				ms += '<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:6px;margin-bottom:3px;background:' + s.c + '08;">';
				ms += '<div style="width:4px;height:18px;border-radius:2px;background:' + s.c + ';"></div>';
				ms += '<span style="flex:1;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:#94a3b8;">' + s.l + '</span>';
				ms += '<span style="font-size:12px;font-weight:800;color:' + s.c + ';">' + s.v + '</span></div>';
			});
			$('#oz-mini-stats').html(ms);
		}
	});

	/* ── Trend + Bar Chart ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_sales_procurement_trend',
		args: args,
		callback: function (r) {
			if (!r.message) return;
			var d = r.message;

			// Interactive bar chart
			oz_build_bar_chart(document.getElementById('oz-bar-chart'), d.labels, d.sales, d.purchase);

			// Monthly breakdown table
			var th = '<table class="oz-table"><thead><tr><th>Month</th><th style="text-align:right;">Sales</th><th style="text-align:right;">Procurement</th><th style="text-align:right;">Difference</th></tr></thead><tbody>';
			for (var i = 0; i < d.labels.length; i++) {
				var s = d.sales[i] || 0, p = d.purchase[i] || 0;
				var diff = s - p;
				var dc = diff >= 0 ? '#059669' : '#dc2626';
				th += '<tr>';
				th += '<td style="font-weight:700;color:#1e293b;">' + d.labels[i] + '</td>';
				th += '<td style="text-align:right;font-weight:700;color:#3b82f6;">' + oz_k(s) + '</td>';
				th += '<td style="text-align:right;font-weight:700;color:#10b981;">' + oz_k(p) + '</td>';
				th += '<td style="text-align:right;font-weight:700;color:' + dc + ';">' + (diff >= 0 ? '+' : '') + oz_k(diff) + '</td>';
				th += '</tr>';
			}
			th += '</tbody></table>';
			$('#oz-monthly-table').html(th);
		}
	});

	/* ── Donut ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_company_stock_distribution',
		args: args,
		callback: function (r) {
			if (!r.message) return;
			var d = r.message;
			var cols = ['#3b82f6', '#10b981', '#f59e0b', '#7c3aed'];
			var data = d.labels.map(function (l, i) { return { label: l, value: Math.round(d.values[i]), color: cols[i] || cols[3] }; });
			oz_donut(document.getElementById('oz-chart-donut'), data, 130);
		}
	});

	/* ── Reservations ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_recent_reservations',
		args: args,
		callback: function (r) {
			var $el = $('#oz-table-res');
			var $el2 = $('#oz-kpi-reserved2');
			var $el3 = $('#oz-kpi-resqty');
			if (!r.message || !r.message.length) {
				$el.html('<div style="text-align:center;padding:20px;color:#94a3b8;font-size:10px;">No active reservations</div>');
				return;
			}
			var totalQty = 0;
			var h = '<table class="oz-table"><thead><tr><th>ID</th><th>Company</th><th>Item</th><th>Qty</th><th>For</th><th>Status</th></tr></thead><tbody>';
			r.message.forEach(function (row) {
				totalQty += row.reserved_qty || 0;
				h += '<tr onclick="frappe.set_route(\'Form\',\'Stock Reservation\',\'' + row.name + '\')">';
				h += '<td style="font-weight:700;color:#3b82f6;">' + row.name + '</td>';
				h += '<td>' + (row.company || '') + '</td>';
				h += '<td>' + (row.item || '') + '</td>';
				h += '<td style="font-weight:800;color:#1e293b;">' + oz_n(row.reserved_qty) + '</td>';
				h += '<td><span class="oz-badge" style="color:#7c3aed;background:#f5f3ff;">' + (row.reserved_for || '') + '</span></td>';
				h += '<td><span class="oz-badge" style="color:#d97706;background:#fffbeb;">' + (row.status || '') + '</span></td></tr>';
			});
			h += '</tbody></table>';
			$el.html(h);

			// Panel 3 KPIs
			oz_count($el2[0], r.message.length, '', '');
			setTimeout(function () { $el2.text(r.message.length + ' Active'); }, 1300);
			oz_count($el3[0], Math.round(totalQty), '', ' L');
			setTimeout(function () { $el3.text(oz_n(totalQty) + ' L'); }, 1300);
		}
	});

	/* ── ICTs ── */
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

	/* ── Negative Stock ── */
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

	/* ── Activity Feed ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_recent_icts',
		args: args,
		callback: function (r) {
			if (!r.message || !r.message.length) { $('#oz-activity').html('<div style="text-align:center;padding:20px;color:#94a3b8;font-size:10px;">No recent activity</div>'); return; }
			var h = '<div class="oz-tl">';
			r.message.slice(0, 8).forEach(function (row) {
				h += '<div class="oz-tl-item" onclick="frappe.set_route(\'Form\',\'Inter Company Transfer\',\'' + row.name + '\')">';
				h += '<div class="oz-tl-dot" style="background:#ecfeff;color:#0891b2;">🔄</div>';
				h += '<div style="flex:1;min-width:0;"><div style="font-size:10px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + row.company + ' → ' + row.to_company + '</div>';
				h += '<div style="display:flex;align-items:center;gap:5px;margin-top:2px;"><span style="font-size:8px;font-weight:700;color:#94a3b8;">' + frappe.datetime.str_to_user(row.posting_date) + '</span>';
				h += '<span class="oz-badge" style="color:#0891b2;background:#ecfeff;margin-left:auto;">' + oz_n(row.total_qty) + ' L</span></div></div></div>';
			});
			h += '</div>';
			$('#oz-activity').html(h);
		}
	});
}
