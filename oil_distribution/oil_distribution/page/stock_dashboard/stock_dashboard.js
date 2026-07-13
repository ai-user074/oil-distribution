frappe.pages['stock-dashboard'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Stock Dashboard',
		single_column: true,
	});

	window.sd_company = 'All';
	window.sd_item = 'All';
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

	// Init company multi-select
	sd_init_multi('sd-ms-company', [
		{ value: 'Geeta Enterprise', label: 'Geeta Enterprise', abbr: 'GE' },
		{ value: 'Global Export', label: 'Global Export', abbr: 'GEX' },
		{ value: 'Shubham Enterprise', label: 'Shubham Enterprise', abbr: 'SHE' }
	], function (selected) {
		var allCo = ['Geeta Enterprise', 'Global Export', 'Shubham Enterprise'];
		var allSelected = selected.length === 0 || selected.length === allCo.length;
		window.sd_company = allSelected ? 'All' : selected.join(',');
		sd_update_filter_tag();
		load_all();
	});

	// Init item multi-select (empty, populated async)
	sd_init_multi('sd-ms-item', [], function (selected) {
		var totalItems = (window.sd_item_options || []).length;
		var allSelected = selected.length === 0 || (totalItems > 0 && selected.length === totalItems);
		window.sd_item = allSelected ? 'All' : selected.join(',');
		sd_update_filter_tag();
		load_all();
	});

	// Populate items
	frappe.xcall('frappe.client.get_list', { doctype: 'Item', fields: ['item_code', 'item_name'], limit_page_length: 0, order_by: 'item_code asc' }).then(function (items) {
		if (!items) return;
		var opts = items.map(function (item) { return { value: item.item_code, label: item.item_code + ' — ' + item.item_name }; });
		window.sd_item_options = opts;
		sd_update_options('sd-ms-item', opts);
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

		.top-bars { position: sticky; top: var(--page-head-height, 48px); z-index: 50; background: #f0f4f8; border-radius: 14px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 6px; padding: 6px; }

		/* Bar */
		.sd-bar { display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; flex-wrap: wrap; }
		.sd-bar label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; display: flex; align-items: center; line-height: 1; margin: 0; }
		.sd-bar select { padding: 5px 26px 5px 8px; border-radius: 7px; border: 1px solid #e2e8f0; background: #f8fafc; color: #334155; font-size: 11px; font-weight: 600; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%2394a3b8'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 7px center; }
		.sd-bar select:focus { outline: none; border-color: #3b82f6; }
		.sd-filter-tag { font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 6px; background: #eff6ff; color: #3b82f6; white-space: nowrap; }

		/* Tabs */
		.sd-tabs { display: flex; gap: 2px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 3px; width: fit-content; }
		.sd-tab-btn { padding: 6px 16px; border-radius: 8px; border: none; background: transparent; font-size: 11px; font-weight: 700; cursor: pointer; color: #94a3b8; transition: all 0.2s; }
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

		/* Multi-select */
		.sd-ms { position: relative; display: inline-block; }
		.sd-ms-btn {
			display: flex; align-items: center; gap: 6px;
			padding: 5px 28px 5px 10px; border-radius: 7px; border: 1px solid #e2e8f0;
			background: #f8fafc; color: #334155; font-size: 11px; font-weight: 600;
			cursor: pointer; min-width: 120px; white-space: nowrap;
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%2394a3b8'/%3E%3C/svg%3E");
			background-repeat: no-repeat; background-position: right 8px center;
			transition: border-color 0.2s;
		}
		.sd-ms-btn:hover { border-color: #cbd5e1; }
		.sd-ms-btn.sd-ms-open { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
		.sd-ms-btn .sd-ms-count { background: #059669; color: #fff; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 10px; }
		.sd-ms-panel {
			display: none; position: fixed; z-index: 9999;
			min-width: 220px; max-height: 280px; overflow-y: auto;
			background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
			box-shadow: 0 8px 24px rgba(0,20,40,0.12); padding: 6px;
		}
		.sd-ms-panel.sd-ms-show { display: block; }
		.sd-ms-search {
			width: 100%; padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px;
			font-size: 11px; outline: none; margin-bottom: 4px;
		}
		.sd-ms-search:focus { border-color: #3b82f6; }
		.sd-ms-actions { display: flex; gap: 4px; padding: 4px 0; border-bottom: 1px solid #f1f5f9; margin-bottom: 4px; }
		.sd-ms-action {
			padding: 3px 8px; border-radius: 5px; border: none; background: transparent;
			font-size: 9px; font-weight: 700; cursor: pointer; color: #3b82f6;
		}
		.sd-ms-action:hover { background: #eff6ff; }
		.sd-ms-opt {
			display: flex; align-items: center; gap: 8px; padding: 5px 8px;
			border-radius: 6px; cursor: pointer; transition: background 0.1s;
		}
		.sd-ms-opt:hover { background: #f1f5f9; }
		.sd-ms-opt input[type="checkbox"] { accent-color: #3b82f6; width: 14px; height: 14px; cursor: pointer; }
		.sd-ms-opt-label { font-size: 11px; font-weight: 600; color: #334155; flex: 1; }
		.sd-ms-opt-abbr { font-size: 9px; font-weight: 700; color: #94a3b8; }
	</style>

	<div class="sd">
		<!-- FILTERS + TABS -->
		<div class="top-bars">
		<div class="sd-bar sd-anim">
			<label>Company</label>
			<div id="sd-ms-company" class="sd-ms"></div>
			<label style="margin-left:8px;">Item</label>
			<div id="sd-ms-item" class="sd-ms" style="min-width:200px;"></div>
			<div style="margin-left:auto;display:flex;gap:6px;flex-shrink:0;">
				<span id="sd-filter-company" class="sd-filter-tag"></span>
			</div>
		</div>

		<!-- TABS -->
		<div class="sd-tabs sd-anim" style="animation-delay:0.04s">
			<button class="sd-tab-btn sd-tab-active" data-tab="overview">Overview</button>
			<button class="sd-tab-btn" data-tab="company">By Company</button>
			<button class="sd-tab-btn" data-tab="item">By Item</button>
			<button class="sd-tab-btn" data-tab="swastik">Swastik Reserved</button>
		</div>
		</div>

		<!-- ═══ PANEL: OVERVIEW ═══ -->
		<div id="sd-panel-overview" class="sd-tab-panel">
			<!-- KPIs -->
			<div class="sd-kpi-row sd-anim" style="animation-delay:0.06s" id="sd-kpis"></div>

			<!-- Row 2: 3 equal cards — Company chart / Utilization / Quick Stats -->
			<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;" class="sd-anim" style="animation-delay:0.1s">
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
						<div><div class="sd-card-title">Utilization</div><div class="sd-card-sub">Reserved / Total Stock</div></div>
					</div>
					<div id="sd-chart-wh" style="display:flex;justify-content:center;"></div>
				</div>
				<div class="sd-card" style="margin-bottom:0;">
					<div class="sd-card-head">
						<div class="sd-card-icon" style="background:#fef3c7;color:#d97706;">⚡</div>
						<div><div class="sd-card-title">Quick Stats</div><div class="sd-card-sub">At a glance</div></div>
					</div>
					<div id="sd-quick-stats"></div>
				</div>
			</div>

			<!-- Row 3: Company detail cards -->
			<div id="sd-company-cards" class="sd-anim" style="animation-delay:0.14s;margin-bottom:14px;"></div>

			<!-- Row 4: Negative Alerts -->
			<div class="sd-card sd-anim" style="animation-delay:0.18s">
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

/* ═══════════ MULTI-SELECT COMPONENT ═══════════ */

function sd_init_multi(containerId, options, onChange, defaultSelected) {
	var container = document.getElementById(containerId);
	if (!container) return;
	container._selected = defaultSelected || options.map(function (o) { return o.value; });
	container._options = options;
	container._onChange = onChange;

	var btn = document.createElement('div');
	btn.className = 'sd-ms-btn';
	btn.textContent = 'All';
	container.appendChild(btn);

	var panel = document.createElement('div');
	panel.className = 'sd-ms-panel';
	panel._container = container;
	document.body.appendChild(panel);
	container._panel = panel;

	document.addEventListener('click', function (e) {
		if (!container.contains(e.target) && !panel.contains(e.target)) {
			panel.classList.remove('sd-ms-show');
			btn.classList.remove('sd-ms-open');
		}
	});

	btn.addEventListener('click', function (e) {
		e.stopPropagation();
		var isOpen = panel.classList.contains('sd-ms-show');
		document.querySelectorAll('.sd-ms-panel').forEach(function (p) { p.classList.remove('sd-ms-show'); });
		document.querySelectorAll('.sd-ms-btn').forEach(function (b) { b.classList.remove('sd-ms-open'); });
		if (!isOpen) {
			panel.classList.add('sd-ms-show');
			btn.classList.add('sd-ms-open');
			var rect = btn.getBoundingClientRect();
			panel.style.left = rect.left + 'px';
			panel.style.top = (rect.bottom + 4) + 'px';
			sd_render_ms_panel(container);
		}
	});

	sd_render_ms_panel(container);
	sd_update_ms_btn(container);
	if (container._onChange) container._onChange(container._selected);
}

function sd_render_ms_panel(container) {
	var panel = container._panel || document.querySelector('.sd-ms-panel');
	var options = container._options || [];
	var selected = container._selected;

	var html = '<input class="sd-ms-search" type="text" placeholder="Search...">';
	html += '<div class="sd-ms-actions">';
	html += '<button class="sd-ms-action" data-action="all">Select All</button>';
	html += '<button class="sd-ms-action" data-action="clear">Clear</button>';
	html += '</div>';
	html += '<div class="sd-ms-error" style="display:none;text-align:center;padding:8px;color:#dc2626;font-size:10px;font-weight:600;">Select at least one element</div>';

	options.forEach(function (opt) {
		var checked = selected.indexOf(opt.value) !== -1 ? 'checked' : '';
		var label = opt.label || opt.value;
		var abbr = opt.abbr ? '<span class="sd-ms-opt-abbr">' + opt.abbr + '</span>' : '';
		html += '<label class="sd-ms-opt">';
		html += '<input type="checkbox" value="' + opt.value + '" ' + checked + '>';
		html += '<span class="sd-ms-opt-label">' + label + '</span>';
		html += abbr;
		html += '</label>';
	});

	if (options.length === 0) {
		html += '<div style="text-align:center;padding:12px;color:#94a3b8;font-size:10px;">Loading...</div>';
	}

	panel.innerHTML = html;

	panel.querySelector('.sd-ms-search').addEventListener('input', function () {
		var q = this.value.toLowerCase();
		panel.querySelectorAll('.sd-ms-opt').forEach(function (opt) {
			var label = opt.querySelector('.sd-ms-opt-label').textContent.toLowerCase();
			opt.style.display = label.indexOf(q) !== -1 ? '' : 'none';
		});
	});

	panel.querySelectorAll('.sd-ms-action').forEach(function (btn) {
		btn.addEventListener('click', function (e) {
			e.preventDefault();
			e.stopPropagation();
			var action = this.getAttribute('data-action');
			if (action === 'all') {
				container._selected = container._options.map(function (o) { return o.value; });
			} else {
				if (container._selected.length <= 1) {
					var errEl = panel.querySelector('.sd-ms-error');
					if (errEl) { errEl.style.display = 'block'; setTimeout(function () { errEl.style.display = 'none'; }, 2000); }
					return;
				}
				container._selected = [container._selected[0]];
			}
			sd_update_ms_btn(container);
			sd_render_ms_panel(container);
			if (container._onChange) container._onChange(container._selected);
		});
	});

	panel.querySelectorAll('.sd-ms-opt input[type="checkbox"]').forEach(function (cb) {
		cb.addEventListener('change', function () {
			var val = this.value;
			if (this.checked) {
				if (container._selected.indexOf(val) === -1) container._selected.push(val);
			} else {
				if (container._selected.length <= 1) {
					this.checked = true;
					var lbl = this.closest('.sd-ms-opt');
					if (lbl) {
						lbl.style.background = '#fee2e2';
						setTimeout(function () { lbl.style.background = ''; }, 1200);
					}
					return;
				}
				container._selected = container._selected.filter(function (v) { return v !== val; });
			}
			sd_update_ms_btn(container);
			sd_render_ms_panel(container);
			if (container._onChange) container._onChange(container._selected);
		});
	});
}

function sd_update_ms_btn(container) {
	var btn = container.querySelector('.sd-ms-btn');
	var sel = container._selected;
	var opts = container._options || [];
	if (sel.length === 0 || sel.length === opts.length) {
		btn.innerHTML = 'All';
	} else if (sel.length === 1) {
		var opt = opts.find(function (o) { return o.value === sel[0]; });
		var label = opt ? (opt.abbr || opt.label || sel[0]) : sel[0];
		btn.innerHTML = label + ' <span class="sd-ms-count">' + sel.length + '</span>';
	} else {
		btn.innerHTML = 'Selected ' + sel.length + ' <span class="sd-ms-count">' + sel.length + '</span>';
	}
}

function sd_update_options(containerId, options) {
	var container = document.getElementById(containerId);
	if (!container) return;
	container._options = options;
	container._selected = options.map(function (o) { return o.value; });
	sd_update_ms_btn(container);
	sd_render_ms_panel(container);
	if (container._onChange) container._onChange(container._selected);
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

/* ═══════════ UTILIZATION DONUT ═══════════ */

function sd_donut(el, avail, reserved) {
	var total = (avail || 0) + (reserved || 0);
	if (total === 0) { el.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:11px;">No stock data</div>'; return; }
	var pct = Math.round((reserved / total) * 100);
	var uid = 'sddu' + Math.random().toString(36).slice(2, 8);
	var sz = 100, st = 14, r = (sz - st) / 2, circ = 2 * Math.PI * r, ct = sz / 2;

	var agap = 0.015, cAvail = '#3b82f6', cRes = '#f59e0b';

	// Available segment
	var aDash = circ * Math.max(0, (100 - pct) / 100 - agap);
	var aGap = circ * agap;
	// Reserved segment
	var rDash = circ * Math.max(0, pct / 100 - agap);
	var rGap = circ * agap;
	var aOff = 0;
	var rOff = -circ * (100 - pct) / 100;

	var s = '<div style="display:flex;align-items:center;gap:16px;justify-content:center;padding:6px 0;">';

	// Donut
	s += '<div style="position:relative;width:' + sz + 'px;height:' + sz + 'px;flex-shrink:0;">';
	s += '<svg width="' + sz + '" height="' + sz + '" style="transform:rotate(-90deg);">';
	s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="#f1f5f9" stroke-width="' + st + '"/>';
	s += '<circle data-idx="0" cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="' + cAvail + '" stroke-width="' + st + '" stroke-linecap="round" stroke-dasharray="0 ' + circ + '" data-target="' + aDash + '" style="cursor:pointer;transition:stroke-dasharray 0.6s ease,stroke-width 0.2s,opacity 0.2s;">';
	s += '<title>Available: ' + sd_n(avail) + ' (' + (100 - pct) + '%)</title></circle>';
	s += '<circle data-idx="1" cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="' + cRes + '" stroke-width="' + st + '" stroke-linecap="round" stroke-dasharray="0 ' + circ + '" stroke-dashoffset="' + rOff + '" data-target="' + rDash + '" style="cursor:pointer;transition:stroke-dasharray 0.6s ease,stroke-width 0.2s,opacity 0.2s;">';
	s += '<title>Reserved: ' + sd_n(reserved) + ' (' + pct + '%)</title></circle>';
	s += '</svg>';
	s += '<div id="' + uid + '-ctr" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;transition:all 0.2s;">';
	s += '<span id="' + uid + '-pct" style="font-size:20px;font-weight:800;color:#1e293b;line-height:1;">' + pct + '%</span>';
	s += '<span id="' + uid + '-lbl" style="font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;color:#94a3b8;margin-top:2px;">Reserved</span>';
	s += '</div></div>';

	// Legend
	s += '<div id="' + uid + '-leg" style="display:flex;flex-direction:column;gap:5px;">';
	s += '<div class="sd-donut-leg" data-idx="0" style="display:flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;cursor:pointer;transition:all 0.15s;border:1px solid transparent;">';
	s += '<div style="width:8px;height:8px;border-radius:2px;background:' + cAvail + ';flex-shrink:0;"></div>';
	s += '<div style="flex:1;min-width:0;"><div style="font-size:10px;font-weight:700;color:#1e293b;">Available</div><div style="font-size:8px;color:#94a3b8;">' + sd_n(avail) + ' L</div></div>';
	s += '<div style="width:30px;height:3px;border-radius:3px;background:#f1f5f9;overflow:hidden;"><div style="height:100%;width:' + (100 - pct) + '%;background:' + cAvail + ';border-radius:3px;"></div></div></div>';
	s += '<div class="sd-donut-leg" data-idx="1" style="display:flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;cursor:pointer;transition:all 0.15s;border:1px solid transparent;">';
	s += '<div style="width:8px;height:8px;border-radius:2px;background:' + cRes + ';flex-shrink:0;"></div>';
	s += '<div style="flex:1;min-width:0;"><div style="font-size:10px;font-weight:700;color:#1e293b;">Reserved</div><div style="font-size:8px;color:#94a3b8;">' + sd_n(reserved) + ' L</div></div>';
	s += '<div style="width:30px;height:3px;border-radius:3px;background:#f1f5f9;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:' + cRes + ';border-radius:3px;"></div></div></div>';
	s += '<div style="display:flex;align-items:center;gap:6px;padding:2px 8px;margin-top:2px;border-top:1px solid #f1f5f9;">';
	s += '<div style="width:8px;height:8px;border-radius:2px;background:#cbd5e1;flex-shrink:0;"></div>';
	s += '<div style="font-size:9px;font-weight:600;color:#64748b;flex:1;">Total</div>';
	s += '<div style="font-size:10px;font-weight:700;color:#1e293b;">' + sd_n(total) + ' L</div>';
	s += '</div></div></div>';

	el.innerHTML = s;

	setTimeout(function () {
		var arcs = el.querySelectorAll('circle[data-target]');
		arcs.forEach(function (a) {
			var t = a.getAttribute('data-target');
			requestAnimationFrame(function () { a.setAttribute('stroke-dasharray', t + ' ' + (circ - t)); });
		});
	}, 80);

	// Interactivity
	setTimeout(function () {
		var segs = el.querySelectorAll('circle[data-idx]');
		var legs = el.querySelectorAll('.sd-donut-leg');
		var ctr = document.getElementById(uid + '-ctr');
		var pctEl = document.getElementById(uid + '-pct');
		var lblEl = document.getElementById(uid + '-lbl');
		var colors = [cAvail, cRes];
		var labels = ['Available', 'Reserved'];
		var vals = [avail, reserved];
		var pcts = [100 - pct, pct];

		function hl(idx) {
			segs.forEach(function (c, i) {
				if (idx === null) { c.style.strokeWidth = st; c.style.opacity = 1; }
				else if (i === idx) { c.style.strokeWidth = st + 4; c.style.opacity = 1; }
				else { c.style.strokeWidth = st - 4; c.style.opacity = 0.3; }
			});
			legs.forEach(function (l, i) {
				if (idx === null) { l.style.borderColor = 'transparent'; l.style.background = 'transparent'; }
				else if (i === idx) { l.style.borderColor = colors[i]; l.style.background = colors[i] + '0c'; }
				else { l.style.borderColor = 'transparent'; l.style.background = 'transparent'; }
			});
			if (idx !== null && pctEl) {
				pctEl.textContent = pcts[idx] + '%';
				pctEl.style.color = colors[idx];
				lblEl.textContent = labels[idx];
			} else if (pctEl) {
				pctEl.textContent = pct + '%';
				pctEl.style.color = '#1e293b';
				lblEl.textContent = 'Reserved';
			}
		}

		segs.forEach(function (c, i) {
			c.addEventListener('mouseenter', function () { hl(i); });
			c.addEventListener('mouseleave', function () { hl(null); });
			c.addEventListener('click', function () {
				var wh = i === 0 ? 'Available' : 'Reserved';
				frappe.set_route('List', 'Bin', { warehouse: ['like', wh + ' WH%'] });
			});
		});
		legs.forEach(function (l, i) {
			l.addEventListener('mouseenter', function () { hl(i); });
			l.addEventListener('mouseleave', function () { hl(null); });
			l.addEventListener('click', function () {
				var wh = i === 0 ? 'Available' : 'Reserved';
				frappe.set_route('List', 'Bin', { warehouse: ['like', wh + ' WH%'] });
			});
		});
	}, 100);
}

/* ═══════════ STACKED BAR (Interactive) ═══════════ */

function sd_stacked_bars(el, labels, series, rawData) {
	if (!labels || !labels.length) { el.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;">No data</div>'; return; }
	rawData = rawData || [];
	var W = 420, H = 210, P = { t: 16, r: 16, b: 48, l: 54 };
	var cw = W - P.l - P.r, ch = H - P.t - P.b;
	var maxStack = labels.map(function (_, i) { return series.reduce(function (s, ser) { return s + (ser.values[i] || 0); }, 0); });
	var mx = Math.max.apply(null, maxStack) * 1.15 || 1;
	var barW = Math.min(cw / labels.length * 0.45, 38);
	var uid = 'sbc' + Math.random().toString(36).slice(2, 8);

	var s = '';
	s += '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:' + H + 'px;overflow:visible;">';
	s += '<defs>';
	series.forEach(function (ser, si) {
		s += '<linearGradient id="' + uid + '-g' + si + '" x1="0" y1="0" x2="0" y2="1">';
		s += '<stop offset="0%" stop-color="' + ser.color + '"/>';
		s += '<stop offset="100%" stop-color="' + ser.color + '" stop-opacity="0.65"/>';
		s += '</linearGradient>';
	});
	s += '<filter id="' + uid + '-glow" x="-20%" y="-20%" width="140%" height="140%">';
	s += '<feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>';
	s += '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>';
	s += '</filter>';
	s += '<filter id="' + uid + '-shadow" x="-4%" y="-4%" width="108%" height="112%">';
	s += '<feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.08"/>';
	s += '</filter>';
	s += '</defs>';

	// Grid lines
	for (var g = 0; g <= 4; g++) {
		var gy = P.t + (g / 4) * ch;
		s += '<line x1="' + P.l + '" y1="' + gy + '" x2="' + (W - P.r) + '" y2="' + gy + '" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="3,3"/>';
		s += '<text x="' + (P.l - 8) + '" y="' + (gy + 3.5) + '" text-anchor="end" fill="#94a3b8" font-size="8" font-weight="600">' + sd_k(mx * (1 - g / 4)) + '</text>';
	}

	// Bars
	var totalPerCompany = labels.map(function (_, i) {
		return series.reduce(function (s, ser) { return s + (ser.values[i] || 0); }, 0);
	});

	labels.forEach(function (l, i) {
		var cx = P.l + (i + 0.5) * (cw / labels.length);
		var cumY = 0;

		series.forEach(function (ser, si) {
			var v = ser.values[i] || 0;
			var h = (v / mx) * ch;
			var y = P.t + ch - cumY - h;
			var barId = uid + '-' + i + '-' + si;
			var pct = totalPerCompany[i] > 0 ? Math.round((v / totalPerCompany[i]) * 100) : 0;

			s += '<rect id="' + barId + '" x="' + (cx - barW / 2) + '" y="' + (P.t + ch) + '" width="' + barW + '" height="0" fill="url(#' + uid + '-g' + si + ')" rx="3" filter="url(#' + uid + '-shadow)" style="cursor:pointer;transition:all 0.3s cubic-bezier(.4,0,.2,1);"';
			s += ' data-target-y="' + y + '" data-target-h="' + Math.max(1, h) + '" data-idx="' + i + '" data-series="' + si + '" data-pct="' + pct + '"';
			s += ' onmouseenter="sd_bc_hover(this,\'' + l + '\',' + i + ')" onmouseleave="sd_bc_leave(this)" onclick="sd_bc_click(this)">';
			s += '<title>' + l + '\n' + ser.name + ': ' + sd_n(v) + ' L (' + pct + '%)</title></rect>';

			// Percentage label on bar segment (only if tall enough and > 5%)
			if (h > 18 && pct > 5) {
				s += '<text id="' + barId + '-lbl" x="' + cx + '" y="' + (P.t + ch) + '" text-anchor="middle" fill="#fff" font-size="8" font-weight="800" style="pointer-events:none;opacity:0;transition:opacity 0.3s;">' + pct + '%</text>';
			}
			cumY += h;
		});

		// Company label
		s += '<text x="' + cx + '" y="' + (H - 24) + '" text-anchor="middle" fill="#475569" font-size="9" font-weight="700">' + l + '</text>';
		// Total on bottom
		s += '<text x="' + cx + '" y="' + (H - 12) + '" text-anchor="middle" fill="#94a3b8" font-size="7" font-weight="600">' + sd_k(totalPerCompany[i]) + '</text>';
	});

	// Legend
	s += '<g transform="translate(' + (W / 2 - 60) + ',' + (H - 2) + ')">';
	series.forEach(function (ser, si) {
		var lx = si * 80;
		s += '<rect x="' + lx + '" y="-6" width="10" height="10" rx="2" fill="' + ser.color + '" opacity="0.85"/>';
		s += '<text x="' + (lx + 14) + '" y="2" fill="#64748b" font-size="8" font-weight="700">' + ser.name + '</text>';
	});
	s += '</g>';
	s += '</svg>';

	// Tooltip div
	s += '<div id="' + uid + '-tip" style="display:none;position:fixed;z-index:9999;background:#1e293b;color:#fff;padding:12px 16px;border-radius:10px;font-size:10px;line-height:1.7;pointer-events:none;box-shadow:0 12px 32px rgba(0,0,0,0.25);max-width:240px;border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(8px);"></div>';

	el.setAttribute('data-raw', JSON.stringify(rawData));
	el.setAttribute('data-uid', uid);
	el.innerHTML = s;

	// Animate bars in with stagger
	setTimeout(function () {
		labels.forEach(function (_, i) {
			series.forEach(function (ser, si) {
				var bar = document.getElementById(uid + '-' + i + '-' + si);
				if (!bar) return;
				var ty = bar.getAttribute('data-target-y');
				var th = bar.getAttribute('data-target-h');
				setTimeout(function () {
					bar.setAttribute('y', ty);
					bar.setAttribute('height', th);
				}, i * 60 + si * 30);
			});
		});
	}, 50);
}

function sd_bc_hover(el, label, idx) {
	el.style.filter = 'url(#' + el.closest('svg').querySelector('filter').id.split('-')[0] + '-glow)';
	el.style.opacity = '0.85';
	var svg = el.closest('svg');
	if (!svg) return;
	var uid = svg.parentElement.getAttribute('data-uid');
	var tip = document.getElementById(uid + '-tip');
	if (!tip) return;

	var raw = JSON.parse(svg.parentElement.getAttribute('data-raw') || '[]');
	var d = raw[idx] || {};
	var total = (d.avail_qty || 0) + (d.reserved_qty || 0);
	var html = '<div style="font-weight:800;margin-bottom:6px;font-size:12px;color:#f1f5f9;">' + (d.company || label) + '</div>';
	html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="width:8px;height:8px;border-radius:50%;background:#3b82f6;display:inline-block;"></span> Available: <b style="color:#93c5fd;">' + sd_n(d.avail_qty || 0) + ' L</b></div>';
	html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="width:8px;height:8px;border-radius:50%;background:#f59e0b;display:inline-block;"></span> Reserved: <b style="color:#fcd34d;">' + sd_n(d.reserved_qty || 0) + ' L</b></div>';
	html += '<div style="border-top:1px solid rgba(255,255,255,0.12);margin-top:5px;padding-top:5px;color:#cbd5e1;font-size:11px;">Total: <b>' + sd_n(total) + ' L</b></div>';
	html += '<div style="color:#94a3b8;font-size:9px;margin-top:3px;">Value: ' + sd_k(d.total_value || 0) + ' · Items: ' + (d.item_count || 0) + '</div>';
	tip.innerHTML = html;
	tip.style.display = 'block';
	var rect = el.getBoundingClientRect();
	tip.style.left = (rect.right + 12) + 'px';
	tip.style.top = rect.top + 'px';

	// Dim other companies, show percentage labels
	var allBars = svg.querySelectorAll('rect[data-idx]');
	allBars.forEach(function (b) {
		if (b.getAttribute('data-idx') !== String(idx)) {
			b.style.opacity = '0.2';
		} else {
			// Show percentage label for this company
			var lblId = b.id + '-lbl';
			var lbl = document.getElementById(lblId);
			if (lbl) lbl.style.opacity = '1';
		}
	});
}

function sd_bc_leave(el) {
	el.style.filter = 'url(#' + el.closest('svg').querySelector('filter').id.split('-')[0] + '-shadow)';
	el.style.opacity = '1';
	var svg = el.closest('svg');
	if (!svg) return;
	var uid = svg.parentElement.getAttribute('data-uid');
	var tip = document.getElementById(uid + '-tip');
	if (tip) tip.style.display = 'none';
	var allBars = svg.querySelectorAll('rect[data-idx]');
	allBars.forEach(function (b) { b.style.opacity = '1'; });
	// Hide all percentage labels
	svg.querySelectorAll('text[id$="-lbl"]').forEach(function (t) { t.style.opacity = '0'; });
}

function sd_bc_click(el) {
	var svg = el.closest('svg');
	if (!svg) return;
	var raw = JSON.parse(svg.parentElement.getAttribute('data-raw') || '[]');
	var idx = parseInt(el.getAttribute('data-idx'));
	var d = raw[idx] || {};
	if (d.company) frappe.set_route('List', 'Bin', { company: d.company });
}

/* ═══════════ FILTER TAG ═══════════ */

function sd_update_filter_tag() {
	var co = window.sd_company || 'All';

	// Company badge
	var coTag = document.getElementById('sd-filter-company');
	if (coTag) {
		if (co === 'All') {
			coTag.textContent = 'All Companies';
			coTag.style.background = '#eff6ff';
			coTag.style.color = '#3b82f6';
		} else {
			var coLabel = co.split(',').map(function (c) {
				var m = { 'Geeta Enterprise': 'GE', 'Global Export': 'GEX', 'Shubham Enterprise': 'SHE' };
				return m[c] || c;
			}).join(', ');
			coTag.textContent = coLabel;
			coTag.style.background = '#ecfdf5';
			coTag.style.color = '#059669';
		}
	}
}

/* ═══════════ DATA LOADING ═══════════ */

function load_all() {
	var co = window.sd_company;
	var item = window.sd_item;

	sd_update_filter_tag();

	var args = { company: co, item: item };

	// Clear all
	$('#sd-kpis').html('<div style="text-align:center;padding:20px;color:#94a3b8;font-size:10px;grid-column:1/-1;">Loading...</div>');
	$('#sd-chart-company,#sd-chart-wh,#sd-neg-alerts,#sd-quick-stats').html('<div style="text-align:center;padding:20px;color:#94a3b8;font-size:10px;">Loading...</div>');
	$('#sd-company-cards').html('<div style="text-align:center;padding:20px;color:#94a3b8;font-size:10px;">Loading...</div>');
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

			// Utilization donut
			sd_donut(document.getElementById('sd-chart-wh'), d.available_stock || d.available_qty || 0, d.reserved_stock || d.reserved_qty || 0);

			$('#sd-wh-breakdown').html('');

			// Quick Stats card
			var qsHtml = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
			var qs = [
				{ lbl: 'Total Stock', val: sd_n(d.total_stock) + ' L', color: '#1e293b', bg: '#f8fafc' },
				{ lbl: 'Total Value', val: sd_k(d.total_value), color: '#1e293b', bg: '#f8fafc' },
				{ lbl: 'Available Value', val: sd_k(d.available_value), color: '#3b82f6', bg: '#eff6ff' },
				{ lbl: 'Reserved Value', val: sd_k(d.reserved_value), color: '#f59e0b', bg: '#fffbeb' },
				{ lbl: 'Items', val: d.items_count, color: '#7c3aed', bg: '#ede9fe' },
				{ lbl: 'Warehouses', val: d.warehouse_count, color: '#059669', bg: '#d1fae5' },
			];
			qs.forEach(function (q) {
				qsHtml += '<div style="padding:6px 8px;background:' + q.bg + ';border-radius:6px;">';
				qsHtml += '<div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">' + q.lbl + '</div>';
				qsHtml += '<div style="font-size:13px;font-weight:800;color:' + q.color + ';">' + q.val + '</div></div>';
			});
			qsHtml += '</div>';
			$('#sd-quick-stats').html(qsHtml);
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
			], r.message);

			// Company detail cards in separate row
			var colors = { 'Geeta Enterprise': { bg: '#eff6ff', accent: '#3b82f6', abbr: 'GE' }, 'Global Export': { bg: '#ecfdf5', accent: '#10b981', abbr: 'GEX' }, 'Shubham Enterprise': { bg: '#fef3c7', accent: '#f59e0b', abbr: 'SHE' } };
			var dh = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">';
			r.message.forEach(function (d) {
				var s = colors[d.company] || { bg: '#f8fafc', accent: '#64748b', abbr: d.company.substring(0, 3).toUpperCase() };
				var total = d.avail_qty + d.reserved_qty;
				var availPct = total > 0 ? Math.round((d.avail_qty / total) * 100) : 0;

				dh += '<div class="sd-card" style="margin-bottom:0;border-left:3px solid ' + s.accent + ';padding:14px;">';
				// Header
				dh += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">';
				dh += '<div style="width:30px;height:30px;border-radius:8px;background:' + s.bg + ';color:' + s.accent + ';display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;">' + s.abbr + '</div>';
				dh += '<div><div style="font-size:11px;font-weight:700;color:#1e293b;">' + d.company + '</div>';
				dh += '<div style="font-size:8px;color:#94a3b8;">' + d.item_count + ' items</div></div>';
				dh += '</div>';
				// Bar + value
				dh += '<div style="height:4px;background:#f1f5f9;border-radius:2px;overflow:hidden;margin-bottom:4px;">';
				dh += '<div style="height:100%;width:' + availPct + '%;background:linear-gradient(90deg,#3b82f6,#7c3aed);border-radius:2px;"></div></div>';
				dh += '<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-size:8px;color:#94a3b8;">' + availPct + '% avail</span><span style="font-size:9px;font-weight:700;color:' + s.accent + ';">' + sd_k(d.total_value) + '</span></div>';
				// Stats
				dh += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">';
				dh += '<div style="padding:6px;background:#eff6ff;border-radius:6px;text-align:center;"><div style="font-size:7px;font-weight:700;color:#94a3b8;">AVAILABLE</div><div style="font-size:13px;font-weight:800;color:#3b82f6;">' + sd_n(d.avail_qty) + '</div></div>';
				dh += '<div style="padding:6px;background:#fffbeb;border-radius:6px;text-align:center;"><div style="font-size:7px;font-weight:700;color:#94a3b8;">RESERVED</div><div style="font-size:13px;font-weight:800;color:#f59e0b;">' + sd_n(d.reserved_qty) + '</div></div>';
				dh += '</div>';
				dh += '</div>';
			});
			dh += '</div>';
			$('#sd-company-cards').html(dh);
		}
	});

	/* ── Negative alerts ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.stock_dashboard.stock_dashboard.get_negative_stock',
		args: args,
		callback: function (r) {
			if (!r.message || !r.message.length) { $('#sd-neg-alerts').html('<div style="text-align:center;padding:20px;color:#059669;font-weight:600;">✓ All clear — no negative stock</div>'); return; }

			// Summary row
			var totalNeg = r.message.length;
			var totalVal = r.message.reduce(function (s, row) { return s + Math.abs(row.stock_value || 0); }, 0);
			var h = '<div style="display:flex;gap:10px;margin-bottom:10px;">';
			h += '<div style="flex:1;padding:8px 10px;background:#fef2f2;border-radius:8px;border-left:3px solid #dc2626;">';
			h += '<div style="font-size:8px;font-weight:700;color:#94a3b8;">ALERTS</div>';
			h += '<div style="font-size:18px;font-weight:800;color:#dc2626;">' + totalNeg + '</div></div>';
			h += '<div style="flex:1;padding:8px 10px;background:#fef2f2;border-radius:8px;border-left:3px solid #dc2626;">';
			h += '<div style="font-size:8px;font-weight:700;color:#94a3b8;">NEGATIVE VALUE</div>';
			h += '<div style="font-size:18px;font-weight:800;color:#dc2626;">' + sd_k(totalVal) + '</div></div>';
			h += '</div>';

			// Detail cards by company
			var byCo = {};
			r.message.forEach(function (row) {
				if (!byCo[row.company]) byCo[row.company] = [];
				byCo[row.company].push(row);
			});

			Object.keys(byCo).forEach(function (co) {
				var rows = byCo[co];
				h += '<div style="border:1px solid #fecaca;border-radius:8px;padding:10px;margin-bottom:8px;background:#fffafa;">';
				h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">';
				h += '<div style="font-size:10px;font-weight:700;color:#dc2626;">' + co + '</div>';
				h += '<span style="font-size:8px;font-weight:700;padding:2px 6px;border-radius:4px;background:#fef2f2;color:#dc2626;">' + rows.length + ' alerts</span>';
				h += '</div>';
				h += '<table style="width:100%;border-collapse:collapse;font-size:10px;">';
				h += '<thead><tr>';
				h += '<th style="text-align:left;padding:3px 4px;font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Warehouse</th>';
				h += '<th style="text-align:left;padding:3px 4px;font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Item</th>';
				h += '<th style="text-align:right;padding:3px 4px;font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Qty</th>';
				h += '<th style="text-align:right;padding:3px 4px;font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Value</th>';
				h += '</tr></thead><tbody>';
				rows.forEach(function (row) {
					h += '<tr onclick="frappe.set_route(\'Form\',\'Bin\',\'' + row.warehouse + '/' + row.item_code + '\')" style="cursor:pointer;">';
					h += '<td style="padding:3px 4px;color:#64748b;border-top:1px solid #fef2f2;">' + (row.warehouse || '').replace(' - ' + (co === 'Geeta Enterprise' ? 'GE' : co === 'Global Export' ? 'GEX' : 'SHE'), '') + '</td>';
					h += '<td style="padding:3px 4px;font-weight:700;color:#1e293b;border-top:1px solid #fef2f2;">' + (row.item_code || '') + '</td>';
					h += '<td style="padding:3px 4px;text-align:right;font-weight:800;color:#dc2626;border-top:1px solid #fef2f2;">' + sd_n(row.actual_qty) + '</td>';
					h += '<td style="padding:3px 4px;text-align:right;font-weight:700;color:#dc2626;border-top:1px solid #fef2f2;">' + sd_k(row.stock_value) + '</td></tr>';
				});
				h += '</tbody></table></div>';
			});
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
				if (!companies[wh.company]) companies[wh.company] = { warehouses: [], total_qty: 0, total_value: 0, total_items: 0 };
				companies[wh.company].warehouses.push(wh);
				companies[wh.company].total_qty += wh.total_qty;
				companies[wh.company].total_value += wh.total_value;
				companies[wh.company].total_items += wh.item_count;
			});

			var colors = {
				'Geeta Enterprise': { bg: '#eff6ff', accent: '#3b82f6', abbr: 'GE' },
				'Global Export': { bg: '#ecfdf5', accent: '#10b981', abbr: 'GEX' },
				'Shubham Enterprise': { bg: '#fef3c7', accent: '#f59e0b', abbr: 'SHE' }
			};

			var html = '';
			Object.keys(companies).forEach(function (co) {
				var c = companies[co];
				var s = colors[co] || { bg: '#f8fafc', accent: '#64748b', abbr: co.substring(0, 3).toUpperCase() };

				// Company header card
				html += '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin-bottom:14px;border-left:4px solid ' + s.accent + ';">';

				// Header with stats
				html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">';
				html += '<div style="display:flex;align-items:center;gap:10px;">';
				html += '<div style="width:36px;height:36px;border-radius:10px;background:' + s.bg + ';color:' + s.accent + ';display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;">' + s.abbr + '</div>';
				html += '<div><div style="font-size:14px;font-weight:800;color:' + s.accent + ';">' + co + '</div>';
				html += '<div style="font-size:9px;color:#94a3b8;">' + c.warehouses.length + ' warehouses · ' + c.total_items + ' items</div></div>';
				html += '</div>';
				html += '<div style="display:flex;gap:16px;">';
				html += '<div style="text-align:right;"><div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Qty</div><div style="font-size:16px;font-weight:800;color:' + s.accent + ';">' + sd_n(c.total_qty) + ' L</div></div>';
				html += '<div style="text-align:right;"><div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Value</div><div style="font-size:16px;font-weight:800;color:' + s.accent + ';">' + sd_k(c.total_value) + '</div></div>';
				html += '</div></div>';

				// Warehouse grid
				html += '<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:10px;">';

				// Sort: Available first, then Reserved, then others
				var sortedWh = c.warehouses.slice().sort(function (a, b) {
					var aA = a.warehouse.indexOf('Available WH') !== -1 ? 0 : a.warehouse.indexOf('Reserved WH') !== -1 ? 1 : 2;
					var bA = b.warehouse.indexOf('Available WH') !== -1 ? 0 : b.warehouse.indexOf('Reserved WH') !== -1 ? 1 : 2;
					return aA - bA;
				});

				sortedWh.forEach(function (wh) {
					var whColor = wh.total_qty < 0 ? '#dc2626' : s.accent;
					var isAvail = wh.warehouse.indexOf('Available WH') !== -1;
					var isReserved = wh.warehouse.indexOf('Reserved WH') !== -1;
					var whTag = isAvail ? 'Available' : isReserved ? 'Reserved' : 'Other';
					var whTagColor = isAvail ? '#10b981' : isReserved ? '#f59e0b' : '#94a3b8';
					var whTagBg = isAvail ? '#ecfdf5' : isReserved ? '#fffbeb' : '#f8fafc';

					html += '<div style="border:1px solid #f1f5f9;border-radius:10px;padding:12px;transition:all 0.15s;" onmouseenter="this.style.borderColor=\'#e2e8f0\';this.style.boxShadow=\'0 2px 8px rgba(0,0,0,0.04)\'" onmouseleave="this.style.borderColor=\'#f1f5f9\';this.style.boxShadow=\'none\'">';

					// Warehouse header
					html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">';
					html += '<div style="display:flex;align-items:center;gap:6px;">';
					html += '<span style="font-size:10px;font-weight:700;color:#1e293b;">' + wh.warehouse.replace(' - ' + s.abbr, '') + '</span>';
					html += '<span style="font-size:8px;font-weight:700;padding:2px 5px;border-radius:4px;background:' + whTagBg + ';color:' + whTagColor + ';">' + whTag + '</span>';
					html += '</div>';
					html += '<div style="font-size:9px;color:#94a3b8;">' + wh.item_count + ' items</div>';
					html += '</div>';

					// Stats bar
					html += '<div style="display:flex;gap:12px;margin-bottom:8px;padding:6px 8px;background:#f8fafc;border-radius:6px;">';
					html += '<div style="flex:1;"><div style="font-size:8px;font-weight:700;color:#94a3b8;">QTY</div><div style="font-size:12px;font-weight:800;color:' + whColor + ';">' + sd_n(wh.total_qty) + '</div></div>';
					html += '<div style="flex:1;"><div style="font-size:8px;font-weight:700;color:#94a3b8;">VALUE</div><div style="font-size:12px;font-weight:800;color:' + s.accent + ';">' + sd_k(wh.total_value) + '</div></div>';
					html += '</div>';

					// Items table
					if (wh.items && wh.items.length) {
						html += '<table style="width:100%;border-collapse:collapse;font-size:10px;">';
						html += '<thead><tr>';
						html += '<th style="text-align:left;padding:3px 4px;font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Item</th>';
						html += '<th style="text-align:right;padding:3px 4px;font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Qty</th>';
						html += '<th style="text-align:right;padding:3px 4px;font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Rate</th>';
						html += '<th style="text-align:right;padding:3px 4px;font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Value</th>';
						html += '</tr></thead><tbody>';

						wh.items.forEach(function (item) {
							var qColor = item.qty < 0 ? '#dc2626' : '#1e293b';
							html += '<tr>';
							html += '<td style="padding:3px 4px;font-weight:700;color:#1e293b;border-top:1px solid #f8fafc;">' + item.item_code + '</td>';
							html += '<td style="padding:3px 4px;text-align:right;font-weight:800;color:' + qColor + ';border-top:1px solid #f8fafc;">' + sd_n(item.qty) + '</td>';
							html += '<td style="padding:3px 4px;text-align:right;color:#64748b;border-top:1px solid #f8fafc;">' + sd_k(item.rate) + '</td>';
							html += '<td style="padding:3px 4px;text-align:right;font-weight:700;color:' + s.accent + ';border-top:1px solid #f8fafc;">' + sd_k(item.value) + '</td>';
							html += '</tr>';
						});
						html += '</tbody></table>';
					} else {
						html += '<div style="text-align:center;padding:8px;color:#e2e8f0;font-size:9px;">No items</div>';
					}

					html += '</div>'; // warehouse card
				});

				html += '</div>'; // grid
				html += '</div>'; // company card
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
				var totalQty = d.total_qty || 1;
				var ch = '<table class="sd-table"><thead><tr><th>Company</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Value</th><th style="width:160px;">Share (of ' + sd_n(totalQty) + ' L)</th></tr></thead><tbody>';
				d.by_company.forEach(function (row) {
					var pct = d.total_qty > 0 ? (row.qty / d.total_qty * 100) : 0;
					ch += '<tr>';
					ch += '<td style="font-weight:700;color:#1e293b;">' + (row.company || '') + '</td>';
					ch += '<td style="text-align:right;font-weight:800;color:#d97706;">' + sd_n(row.qty) + ' L</td>';
					ch += '<td style="text-align:right;font-weight:700;color:#059669;">' + sd_k(row.val) + '</td>';
					ch += '<td><div style="display:flex;align-items:center;gap:6px;"><div class="sd-prog" style="flex:1;"><div class="sd-prog-fill" style="width:' + pct + '%;background:linear-gradient(90deg,#f59e0b,#fbbf24);"></div></div><span style="font-size:9px;font-weight:700;color:#d97706;min-width:36px;text-align:right;">' + pct.toFixed(1) + '%</span></div></td>';
					ch += '</tr>';
				});
				ch += '</tbody></table>';
				$('#sd-swastik-company').html(ch);
			}

			// By item table
			if (d.by_item && d.by_item.length) {
				var totalQty = d.total_qty || 1;
				var ih = '<table class="sd-table"><thead><tr><th>Item</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Value</th><th style="width:160px;">Share (of ' + sd_n(totalQty) + ' L)</th></tr></thead><tbody>';
				d.by_item.forEach(function (row) {
					var pct = d.total_qty > 0 ? (row.qty / d.total_qty * 100) : 0;
					ih += '<tr>';
					ih += '<td style="font-weight:700;color:#1e293b;">' + (row.item_code || '') + '</td>';
					ih += '<td style="text-align:right;font-weight:800;color:#d97706;">' + sd_n(row.qty) + ' L</td>';
					ih += '<td style="text-align:right;font-weight:700;color:#059669;">' + sd_k(row.val) + '</td>';
					ih += '<td><div style="display:flex;align-items:center;gap:6px;"><div class="sd-prog" style="flex:1;"><div class="sd-prog-fill" style="width:' + pct + '%;background:linear-gradient(90deg,#7c3aed,#a78bfa);"></div></div><span style="font-size:9px;font-weight:700;color:#7c3aed;min-width:36px;text-align:right;">' + pct.toFixed(1) + '%</span></div></td>';
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
