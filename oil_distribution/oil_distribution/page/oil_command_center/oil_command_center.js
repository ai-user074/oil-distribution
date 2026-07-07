frappe.pages['oil-command-center'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Oil Distribution Command Center',
		single_column: true,
	});

	window.oz_company = 'All';
	window.oz_item = 'All';
	window.oz_period = 'MTD';
	window.oz_months = 6;

	page.main.html(get_dashboard_html());

	// Tabs
	page.main.find('.oz-tab-btn').on('click', function () {
		var tab = $(this).data('tab');
		window.oz_tab = tab;
		page.main.find('.oz-tab-btn').removeClass('oz-tab-active');
		$(this).addClass('oz-tab-active');
		page.main.find('.oz-tab-panel').hide();
		page.main.find('#oz-panel-' + tab).show();
	});

	// Period
	page.main.find('.oz-period-btn').on('click', function () {
		page.main.find('.oz-period-btn').removeClass('oz-period-active');
		$(this).addClass('oz-period-active');
		window.oz_period = $(this).data('period');
		if (window.oz_period === 'YTD') window.oz_months = 12;
		else if (window.oz_period === 'QTD') window.oz_months = 3;
		else window.oz_months = 6;
		load_all_data();
	});

	// Month range slider
	page.main.find('#oz-month-range').on('input', function () {
		window.oz_months = parseInt($(this).val());
		page.main.find('#oz-month-label').text(window.oz_months + ' months');
		load_all_data();
	});

	// Init company multi-select
	oz_init_multi('oz-ms-company', [
		{ value: 'Geeta Enterprise', label: 'Geeta Enterprise', abbr: 'GE' },
		{ value: 'Global Export', label: 'Global Export', abbr: 'GEX' },
		{ value: 'Shubham Enterprise', label: 'Shubham Enterprise', abbr: 'SHE' }
	], function (selected) {
		window.oz_company = selected.length === 0 ? 'All' : selected.join(',');
		load_all_data();
	});

	// Init item multi-select (empty, populated async)
	oz_init_multi('oz-ms-item', [], function (selected) {
		window.oz_item = selected.length === 0 ? 'All' : selected.join(',');
		load_all_data();
	});

	// Populate items
	frappe.xcall('frappe.client.get_list', { doctype: 'Item', fields: ['item_code', 'item_name'], limit_page_length: 0, order_by: 'item_code asc' }).then(function (items) {
		if (!items) return;
		var opts = items.map(function (item) { return { value: item.item_code, label: item.item_code + ' — ' + item.item_name }; });
		oz_update_options('oz-ms-item', opts);
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

		.oz-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; box-shadow: 0 1px 3px rgba(0,20,40,0.04); }

		/* Bar */
		.oz-bar { display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 14px; flex-wrap: wrap; }
		.oz-bar label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; }
		.oz-bar select { padding: 5px 26px 5px 8px; border-radius: 7px; border: 1px solid #e2e8f0; background: #f8fafc; color: #334155; font-size: 11px; font-weight: 600; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%2394a3b8'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 7px center; }
		.oz-bar select:focus { outline: none; border-color: #3b82f6; }

		/* Tabs */
		.oz-tabs { display: flex; gap: 2px; margin-bottom: 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 4px; width: fit-content; }
		.oz-tab-btn { padding: 7px 18px; border-radius: 8px; border: none; background: transparent; font-size: 11px; font-weight: 700; cursor: pointer; color: #94a3b8; transition: all 0.2s; }
		.oz-tab-btn:hover { color: #475569; background: #f8fafc; }
		.oz-tab-active { background: #3b82f6 !important; color: #fff !important; }

		/* Period */
		.oz-period-btn { padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 9px; font-weight: 700; cursor: pointer; color: #94a3b8; transition: all 0.2s; }
		.oz-period-btn:hover { border-color: #3b82f6; color: #3b82f6; }
		.oz-period-active { background: #3b82f6 !important; color: #fff !important; border-color: #3b82f6 !important; }

		/* KPI */
		.oz-kpi-row { display: grid; gap: 10px; margin-bottom: 14px; }
		.oz-kpi-row-3 { grid-template-columns: repeat(3, 1fr); }
		.oz-kpi-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 12px; }
		.oz-kpi-card:hover { box-shadow: 0 4px 12px rgba(0,20,40,0.08); transform: translateY(-2px); }
		.oz-kpi-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
		.oz-kpi-info { flex: 1; min-width: 0; }
		.oz-kpi-val { font-size: 22px; font-weight: 800; line-height: 1.1; }
		.oz-kpi-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-top: 1px; }
		.oz-kpi-spark { margin-top: 3px; }

		/* Chart card */
		.oz-chart-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 14px; }
		.oz-chart-head { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
		.oz-chart-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; }
		.oz-chart-title { font-size: 12px; font-weight: 700; color: #1e293b; }
		.oz-chart-sub { font-size: 9px; color: #94a3b8; }

		/* Table */
		.oz-table { width: 100%; border-collapse: collapse; font-size: 11px; }
		.oz-table th { text-align: left; padding: 7px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
		.oz-table td { padding: 8px 10px; border-bottom: 1px solid #f8fafc; color: #475569; }
		.oz-table tr { cursor: pointer; transition: background 0.15s; }
		.oz-table tr:hover { background: #f1f5f9; }

		.oz-badge { display: inline-block; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
		.oz-link { font-size: 10px; font-weight: 600; color: #3b82f6; cursor: pointer; text-decoration: none; }
		.oz-link:hover { text-decoration: underline; }

		.oz-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
		.oz-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 14px; }
		.oz-grid-6-4 { display: grid; grid-template-columns: 6fr 4fr; gap: 12px; margin-bottom: 14px; }
		.oz-grid-4-6 { display: grid; grid-template-columns: 4fr 6fr; gap: 12px; margin-bottom: 14px; }
		.oz-grid-7-3 { display: grid; grid-template-columns: 7fr 3fr; gap: 12px; margin-bottom: 14px; }

		/* Funnel */
		.oz-funnel-bar { height: 6px; border-radius: 6px; background: #f1f5f9; overflow: hidden; }
		.oz-funnel-fill { height: 100%; border-radius: 6px; transition: width 0.8s cubic-bezier(0.22,1,0.36,1); }

		/* Timeline */
		.oz-tl { position: relative; padding-left: 14px; }
		.oz-tl::before { content: ''; position: absolute; left: 5px; top: 4px; bottom: 4px; width: 1px; background: linear-gradient(to bottom, #cbd5e1, transparent); }
		.oz-tl-item { display: flex; gap: 8px; padding: 5px 4px; border-radius: 6px; margin-bottom: 2px; cursor: pointer; transition: all 0.15s; }
		.oz-tl-item:hover { background: #f1f5f9; }
		.oz-tl-dot { width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 10px; position: relative; z-index: 1; }

		/* Tooltip */
		.oz-tip { position: absolute; background: #1e293b; color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 10px; pointer-events: none; z-index: 200; white-space: nowrap; box-shadow: 0 4px 16px rgba(0,0,0,0.2); transform: translateX(-50%); opacity: 0; transition: opacity 0.15s; }
		.oz-tip.show { opacity: 1; }
		.oz-tip::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: #1e293b; }

		/* Progress bar */
		.oz-prog { height: 4px; border-radius: 4px; background: #f1f5f9; overflow: hidden; }
		.oz-prog-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }

		/* Rank badge */
		.oz-rank { width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; flex-shrink: 0; }

		/* ICT chain card */
		.oz-chain { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; padding: 8px 0; }
		.oz-chain-step { padding: 4px 8px; border-radius: 6px; font-size: 9px; font-weight: 700; background: #f1f5f9; color: #64748b; }
		.oz-chain-active { background: #dbeafe; color: #3b82f6; }
		.oz-chain-arrow { color: #cbd5e1; font-size: 10px; }

		/* Sparkline */
		.oz-spark { display: inline-block; vertical-align: middle; }

		@keyframes ozFadeIn { 0%{opacity:0;transform:translateY(8px);}100%{opacity:1;transform:translateY(0);} }
		.oz-anim { animation: ozFadeIn 0.35s ease both; }

		/* Multi-select */
		.oz-ms { position: relative; display: inline-block; }
		.oz-ms-btn {
			display: flex; align-items: center; gap: 6px;
			padding: 5px 28px 5px 10px; border-radius: 7px; border: 1px solid #e2e8f0;
			background: #f8fafc; color: #334155; font-size: 11px; font-weight: 600;
			cursor: pointer; min-width: 120px; white-space: nowrap;
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%2394a3b8'/%3E%3C/svg%3E");
			background-repeat: no-repeat; background-position: right 8px center;
			transition: border-color 0.2s;
		}
		.oz-ms-btn:hover { border-color: #cbd5e1; }
		.oz-ms-btn.oz-ms-open { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
		.oz-ms-btn .oz-ms-count { background: #3b82f6; color: #fff; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 10px; }
		.oz-ms-panel {
			display: none; position: absolute; top: calc(100% + 4px); left: 0; z-index: 200;
			min-width: 220px; max-height: 280px; overflow-y: auto;
			background: #fff; border: 1px solid #e2e8f0; border-radius: 10px;
			box-shadow: 0 8px 24px rgba(0,20,40,0.12); padding: 6px;
		}
		.oz-ms-panel.oz-ms-show { display: block; }
		.oz-ms-search {
			width: 100%; padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px;
			font-size: 11px; outline: none; margin-bottom: 4px;
		}
		.oz-ms-search:focus { border-color: #3b82f6; }
		.oz-ms-actions { display: flex; gap: 4px; padding: 4px 0; border-bottom: 1px solid #f1f5f9; margin-bottom: 4px; }
		.oz-ms-action {
			padding: 3px 8px; border-radius: 5px; border: none; background: transparent;
			font-size: 9px; font-weight: 700; cursor: pointer; color: #3b82f6;
		}
		.oz-ms-action:hover { background: #eff6ff; }
		.oz-ms-opt {
			display: flex; align-items: center; gap: 8px; padding: 5px 8px;
			border-radius: 6px; cursor: pointer; transition: background 0.1s;
		}
		.oz-ms-opt:hover { background: #f1f5f9; }
		.oz-ms-opt input[type="checkbox"] { accent-color: #3b82f6; width: 14px; height: 14px; cursor: pointer; }
		.oz-ms-opt-label { font-size: 11px; font-weight: 600; color: #334155; flex: 1; }
		.oz-ms-opt-abbr { font-size: 9px; font-weight: 700; color: #94a3b8; }
	</style>

	<div class="oz">
		<!-- FILTERS -->
		<div class="oz-bar oz-anim" style="position:relative;z-index:100;">
			<label>Company</label>
			<div id="oz-ms-company" class="oz-ms"></div>
			<label style="margin-left:8px;">Item</label>
			<div id="oz-ms-item" class="oz-ms" style="min-width:200px;"></div>
			<span id="oz-filter-tag" style="margin-left:auto;font-size:9px;font-weight:700;padding:3px 8px;border-radius:6px;background:#eff6ff;color:#3b82f6;">All</span>
		</div>

		<!-- TABS -->
		<div class="oz-tabs oz-anim" style="animation-delay:0.04s">
			<button class="oz-tab-btn oz-tab-active" data-tab="sales">Sales & Procurement</button>
			<button class="oz-tab-btn" data-tab="stock">Stock Intelligence</button>
			<button class="oz-tab-btn" data-tab="ict">ICT & Reservations</button>
		</div>

		<!-- ═══ PANEL 1: SALES & PROCUREMENT ═══ -->
		<div id="oz-panel-sales" class="oz-tab-panel">

			<!-- Period Selector + Month Range -->
			<div class="oz-bar oz-anim" style="animation-delay:0.06s;margin-bottom:12px;">
				<label>Period</label>
				<button class="oz-period-btn oz-period-active" data-period="MTD">MTD</button>
				<button class="oz-period-btn" data-period="QTD">QTD</button>
				<button class="oz-period-btn" data-period="YTD">YTD</button>
				<div style="margin-left:16px;display:flex;align-items:center;gap:6px;">
					<label>Months</label>
					<input id="oz-month-range" type="range" min="3" max="12" value="6" style="width:80px;accent-color:#3b82f6;">
					<span id="oz-month-label" style="font-size:10px;font-weight:700;color:#334155;">6 months</span>
				</div>
			</div>

			<!-- KPIs with sparklines -->
			<div class="oz-kpi-row oz-kpi-row-3 oz-anim" style="animation-delay:0.08s">
				<div class="oz-kpi-card" onclick="frappe.set_route('List','Sales Invoice')">
					<div class="oz-kpi-icon" style="background:#dbeafe;color:#3b82f6;">₹</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-sales" style="color:#3b82f6;">--</div>
						<div class="oz-kpi-lbl">Sales <span id="oz-period-sales" style="color:#3b82f6;">MTD</span></div>
						<div class="oz-kpi-spark" id="oz-spark-sales"></div>
					</div>
				</div>
				<div class="oz-kpi-card" onclick="frappe.set_route('List','Purchase Invoice')">
					<div class="oz-kpi-icon" style="background:#d1fae5;color:#059669;">₹</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-proc" style="color:#059669;">--</div>
						<div class="oz-kpi-lbl">Procurement <span id="oz-period-proc" style="color:#059669;">MTD</span></div>
						<div class="oz-kpi-spark" id="oz-spark-proc"></div>
					</div>
				</div>
				<div class="oz-kpi-card" onclick="frappe.set_route('List','Inter Company Transfer',{docstatus:1})">
					<div class="oz-kpi-icon" style="background:#cffafe;color:#0891b2;">🔄</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-ict" style="color:#0891b2;">--</div>
						<div class="oz-kpi-lbl">ICT Volume <span style="color:#0891b2;">MTD</span></div>
						<div class="oz-kpi-spark" id="oz-spark-ict"></div>
					</div>
				</div>
			</div>

			<!-- Bar Chart -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.12s">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#dbeafe;color:#3b82f6;">📊</div>
					<div style="flex:1;">
						<div class="oz-chart-title">Monthly Sales vs Procurement</div>
						<div class="oz-chart-sub">Click a bar to drill into that month</div>
					</div>
				</div>
				<div id="oz-bar-chart" style="position:relative;min-height:240px;"></div>
				<div id="oz-bar-tooltip" class="oz-tip"></div>
			</div>

			<!-- Top Items + Top Customers -->
			<div class="oz-grid-2 oz-anim" style="animation-delay:0.16s">
				<div class="oz-chart-card" style="margin-bottom:0;">
					<div class="oz-chart-head">
						<div class="oz-chart-icon" style="background:#ede9fe;color:#7c3aed;">📦</div>
						<div style="flex:1;">
							<div class="oz-chart-title">Top Items by Revenue</div>
							<div class="oz-chart-sub">Current period</div>
						</div>
					</div>
					<div id="oz-top-items"></div>
				</div>
				<div class="oz-chart-card" style="margin-bottom:0;">
					<div class="oz-chart-head">
						<div class="oz-chart-icon" style="background:#fef3c7;color:#d97706;">👥</div>
						<div style="flex:1;">
							<div class="oz-chart-title">Top Customers</div>
							<div class="oz-chart-sub">Current period</div>
						</div>
					</div>
					<div id="oz-top-customers"></div>
				</div>
			</div>

			<!-- Company Comparison -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.2s">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#ecfeff;color:#0891b2;">🏢</div>
					<div>
						<div class="oz-chart-title">Company Comparison</div>
						<div class="oz-chart-sub">Sales vs Procurement vs Stock</div>
					</div>
				</div>
				<div id="oz-company-compare"></div>
			</div>
		</div>

		<!-- ═══ PANEL 2: STOCK INTELLIGENCE ═══ -->
		<div id="oz-panel-stock" class="oz-tab-panel" style="display:none;">

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
				<div class="oz-chart-card" style="margin-bottom:0;">
					<div class="oz-chart-head">
						<div class="oz-chart-icon" style="background:#fef2f2;color:#dc2626;">🔥</div>
						<div><div class="oz-chart-title">Stock Pipeline</div><div class="oz-chart-sub">Available → Reserved → Alerts</div></div>
					</div>
					<div id="oz-funnel-content"></div>
				</div>
				<div style="display:flex;flex-direction:column;gap:12px;">
					<div class="oz-chart-card" style="margin-bottom:0;flex:1;">
						<div class="oz-chart-head">
							<div class="oz-chart-icon" style="background:#dbeafe;color:#3b82f6;">⏱</div>
							<div><div class="oz-chart-title">Utilization</div></div>
						</div>
						<div id="oz-ring" style="display:flex;justify-content:center;"></div>
					</div>
					<div class="oz-chart-card" style="margin-bottom:0;">
						<div class="oz-chart-head">
							<div class="oz-chart-icon" style="background:#ecfdf5;color:#059669;">⚡</div>
							<div><div class="oz-chart-title">Quick Stats</div></div>
						</div>
						<div id="oz-mini-stats"></div>
					</div>
				</div>
			</div>

			<div class="oz-grid-2 oz-anim" style="animation-delay:0.14s">
				<div class="oz-chart-card" style="margin-bottom:0;">
					<div class="oz-chart-head">
						<div class="oz-chart-icon" style="background:#ede9fe;color:#7c3aed;">💡</div>
						<div><div class="oz-chart-title">Stock Distribution</div><div class="oz-chart-sub">By company</div></div>
					</div>
					<div id="oz-chart-donut" style="display:flex;justify-content:center;"></div>
				</div>
				<div class="oz-chart-card" style="margin-bottom:0;">
					<div class="oz-chart-head">
						<div class="oz-chart-icon" style="background:#fef2f2;color:#dc2626;">⚠</div>
						<div style="flex:1;"><div class="oz-chart-title">Negative Stock Alerts</div></div>
						<a class="oz-link" style="color:#dc2626;" onclick="frappe.set_route('List','Bin',{actual_qty:['<',0]})">View →</a>
					</div>
					<div id="oz-table-neg"></div>
				</div>
			</div>

			<!-- Warehouse Breakdown -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.18s">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#d1fae5;color:#059669;">🏭</div>
					<div><div class="oz-chart-title">Warehouse Stock Breakdown</div><div class="oz-chart-sub">All warehouses with stock</div></div>
				</div>
				<div id="oz-warehouse-table"></div>
			</div>
		</div>

		<!-- ═══ PANEL 3: ICT & RESERVATIONS ═══ -->
		<div id="oz-panel-ict" class="oz-tab-panel" style="display:none;">

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

			<!-- Reservations -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.1s">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#fef3c7;color:#d97706;">🛡</div>
					<div style="flex:1;"><div class="oz-chart-title">Active Reservations</div><div class="oz-chart-sub">Swastik reserved stock</div></div>
					<a class="oz-link" onclick="frappe.set_route('List','Stock Reservation',{status:'Reserved'})">View All →</a>
				</div>
				<div id="oz-table-res"></div>
			</div>

			<!-- ICT Chain Visualization -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.14s">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#cffafe;color:#0891b2;">🔗</div>
					<div style="flex:1;"><div class="oz-chart-title">ICT Chain Detail</div><div class="oz-chart-sub">Transfer items and status</div></div>
				</div>
				<div id="oz-ict-chain"></div>
			</div>

			<!-- ICT Table -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.18s">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#cffafe;color:#0891b2;">🔄</div>
					<div style="flex:1;"><div class="oz-chart-title">Recent Transfers</div></div>
					<a class="oz-link" onclick="frappe.set_route('List','Inter Company Transfer')">View All →</a>
				</div>
				<div id="oz-table-ict"></div>
			</div>

			<!-- Activity Feed -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.22s">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#ede9fe;color:#7c3aed;">☁</div>
					<div><div class="oz-chart-title">Activity Feed</div></div>
				</div>
				<div id="oz-activity"></div>
			</div>
		</div>

	</div>`;
}

/* ═══════════ MULTI-SELECT COMPONENT ═══════════ */

function oz_init_multi(containerId, options, onChange) {
	var container = document.getElementById(containerId);
	if (!container) return;
	container._selected = [];
	container._options = options;
	container._onChange = onChange;

	var btn = document.createElement('div');
	btn.className = 'oz-ms-btn';
	btn.textContent = 'All';
	container.appendChild(btn);

	var panel = document.createElement('div');
	panel.className = 'oz-ms-panel';
	container.appendChild(panel);

	// Close on outside click
	document.addEventListener('click', function (e) {
		if (!container.contains(e.target)) {
			panel.classList.remove('oz-ms-show');
			btn.classList.remove('oz-ms-open');
		}
	});

	btn.addEventListener('click', function (e) {
		e.stopPropagation();
		var isOpen = panel.classList.contains('oz-ms-show');
		// Close all other panels
		document.querySelectorAll('.oz-ms-panel').forEach(function (p) { p.classList.remove('oz-ms-show'); });
		document.querySelectorAll('.oz-ms-btn').forEach(function (b) { b.classList.remove('oz-ms-open'); });
		if (!isOpen) {
			panel.classList.add('oz-ms-show');
			btn.classList.add('oz-ms-open');
			oz_render_ms_panel(container);
		}
	});

	oz_render_ms_panel(container);
}

function oz_render_ms_panel(container) {
	var panel = container.querySelector('.oz-ms-panel');
	var options = container._options || [];
	var selected = container._selected;

	var html = '<input class="oz-ms-search" type="text" placeholder="Search...">';
	html += '<div class="oz-ms-actions">';
	html += '<button class="oz-ms-action" data-action="all">Select All</button>';
	html += '<button class="oz-ms-action" data-action="clear">Clear</button>';
	html += '</div>';

	options.forEach(function (opt) {
		var checked = selected.indexOf(opt.value) !== -1 ? 'checked' : '';
		var label = opt.label || opt.value;
		var abbr = opt.abbr ? '<span class="oz-ms-opt-abbr">' + opt.abbr + '</span>' : '';
		html += '<label class="oz-ms-opt">';
		html += '<input type="checkbox" value="' + opt.value + '" ' + checked + '>';
		html += '<span class="oz-ms-opt-label">' + label + '</span>';
		html += abbr;
		html += '</label>';
	});

	if (options.length === 0) {
		html += '<div style="text-align:center;padding:12px;color:#94a3b8;font-size:10px;">Loading...</div>';
	}

	panel.innerHTML = html;

	// Search
	panel.querySelector('.oz-ms-search').addEventListener('input', function () {
		var q = this.value.toLowerCase();
		panel.querySelectorAll('.oz-ms-opt').forEach(function (opt) {
			var label = opt.querySelector('.oz-ms-opt-label').textContent.toLowerCase();
			opt.style.display = label.indexOf(q) !== -1 ? '' : 'none';
		});
	});

	// Select All / Clear
	panel.querySelectorAll('.oz-ms-action').forEach(function (btn) {
		btn.addEventListener('click', function (e) {
			e.preventDefault();
			var action = this.getAttribute('data-action');
			if (action === 'all') {
				container._selected = container._options.map(function (o) { return o.value; });
			} else {
				container._selected = [];
			}
			oz_update_ms_btn(container);
			oz_render_ms_panel(container);
			if (container._onChange) container._onChange(container._selected);
		});
	});

	// Checkbox change
	panel.querySelectorAll('.oz-ms-opt input[type="checkbox"]').forEach(function (cb) {
		cb.addEventListener('change', function () {
			var val = this.value;
			if (this.checked) {
				if (container._selected.indexOf(val) === -1) container._selected.push(val);
			} else {
				container._selected = container._selected.filter(function (v) { return v !== val; });
			}
			oz_update_ms_btn(container);
			if (container._onChange) container._onChange(container._selected);
		});
	});
}

function oz_update_ms_btn(container) {
	var btn = container.querySelector('.oz-ms-btn');
	var sel = container._selected;
	var opts = container._options || [];
	if (sel.length === 0) {
		btn.innerHTML = 'All';
	} else if (sel.length <= 2) {
		var labels = sel.map(function (v) {
			var opt = opts.find(function (o) { return o.value === v; });
			return opt ? (opt.abbr || opt.label || v) : v;
		});
		btn.innerHTML = labels.join(', ') + ' <span class="oz-ms-count">' + sel.length + '</span>';
	} else {
		btn.innerHTML = sel.length + ' selected <span class="oz-ms-count">' + sel.length + '</span>';
	}
}

function oz_update_options(containerId, options) {
	var container = document.getElementById(containerId);
	if (!container) return;
	container._options = options;
	container._selected = [];
	oz_update_ms_btn(container);
	// If panel is open, re-render
	if (container.querySelector('.oz-ms-panel').classList.contains('oz-ms-show')) {
		oz_render_ms_panel(container);
	}
}

/* ═══════════ UTILITIES ═══════════ */

function oz_k(v) { v = parseFloat(v) || 0; if (Math.abs(v) >= 1000) return '₹' + (v / 1000).toFixed(1) + 'K'; return '₹' + v.toFixed(0); }
function oz_n(v) { v = parseFloat(v) || 0; if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + 'K'; return v.toFixed(0); }
function oz_count(el, target, pre, suf, dur) {
	pre = pre || ''; suf = suf || ''; dur = dur || 1200;
	var start = null;
	function step(ts) { if (!start) start = ts; var p = Math.min((ts - start) / dur, 1); var e = 1 - Math.pow(1 - p, 3); el.textContent = pre + Math.floor(e * target).toLocaleString() + suf; if (p < 1) requestAnimationFrame(step); }
	requestAnimationFrame(step);
}

function oz_sparkline(el, values, color) {
	if (!values || values.length < 2) { el.innerHTML = ''; return; }
	var w = 80, h = 18, p = 2;
	var mx = Math.max.apply(null, values) || 1;
	var pts = values.map(function (v, i) { return { x: p + (i / (values.length - 1)) * (w - 2 * p), y: p + (h - 2 * p) - (v / mx) * (h - 2 * p) }; });
	var path = pts.map(function (q, i) { return (i === 0 ? 'M' : 'L') + ' ' + q.x.toFixed(1) + ' ' + q.y.toFixed(1); }).join(' ');
	var area = path + ' L ' + pts[pts.length - 1].x.toFixed(1) + ' ' + (h - p) + ' L ' + pts[0].x.toFixed(1) + ' ' + (h - p) + ' Z';
	var gid = 'sp-' + Math.random().toString(36).substr(2, 6);
	var s = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" class="oz-spark">';
	s += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + color + '" stop-opacity="0.3"/><stop offset="100%" stop-color="' + color + '" stop-opacity="0.05"/></linearGradient></defs>';
	s += '<path d="' + area + '" fill="url(#' + gid + ')"/>';
	s += '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linecap="round"/>';
	s += '<circle cx="' + pts[pts.length - 1].x.toFixed(1) + '" cy="' + pts[pts.length - 1].y.toFixed(1) + '" r="2.5" fill="' + color + '"/>';
	s += '</svg>';
	el.innerHTML = s;
}

/* ═══════════ INTERACTIVE BAR CHART ═══════════ */

function oz_build_bar_chart(container, tooltip, labels, sales, purchase) {
	if (!labels || !labels.length) { container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">No data</div>'; return; }

	var W = 700, H = 230, P = { t: 20, r: 20, b: 40, l: 55 };
	var cw = W - P.l - P.r, ch = H - P.t - P.b;
	var all = sales.concat(purchase);
	var mx = Math.max.apply(null, all) * 1.15 || 1;
	var n = labels.length;
	var groupW = cw / n;
	var barW = Math.min(groupW * 0.3, 30);

	function yScale(v) { return P.t + ch - (v / mx) * ch; }

	var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:' + H + 'px;">';

	// Defs
	s += '<defs>';
	s += '<filter id="barShadow"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.1"/></filter>';
	s += '</defs>';

	// Grid
	for (var g = 0; g <= 5; g++) {
		var gy = P.t + (g / 5) * ch;
		var val = Math.round(mx * (1 - g / 5));
		s += '<line x1="' + P.l + '" y1="' + gy + '" x2="' + (W - P.r) + '" y2="' + gy + '" stroke="#e2e8f0" stroke-width="0.5"/>';
		s += '<text x="' + (P.l - 8) + '" y="' + (gy + 3) + '" text-anchor="end" fill="#94a3b8" font-size="8" font-weight="600">' + oz_k(val) + '</text>';
	}

	// Bars
	labels.forEach(function (l, i) {
		var cx = P.l + i * groupW + groupW / 2;
		var sx = cx - barW - 3;
		var px = cx + 3;
		var sv = sales[i] || 0, pv = purchase[i] || 0;
		var sh = Math.max(1, (sv / mx) * ch), ph = Math.max(1, (pv / mx) * ch);

		// Sales bar with hover rect
		s += '<g class="oz-bar-group" data-idx="' + i + '" data-type="sales">';
		s += '<rect x="' + sx + '" y="' + yScale(sv) + '" width="' + barW + '" height="' + sh + '" rx="3" fill="#3b82f6" opacity="0.8" filter="url(#barShadow)" style="transition:opacity 0.15s;cursor:pointer;"/>';
		s += '<rect x="' + sx + '" y="' + (P.t) + '" width="' + barW + '" height="' + ch + '" fill="transparent" style="cursor:pointer;"/>';
		s += '</g>';

		// Procurement bar
		s += '<g class="oz-bar-group" data-idx="' + i + '" data-type="purchase">';
		s += '<rect x="' + px + '" y="' + yScale(pv) + '" width="' + barW + '" height="' + ph + '" rx="3" fill="#10b981" opacity="0.8" filter="url(#barShadow)" style="transition:opacity 0.15s;cursor:pointer;"/>';
		s += '<rect x="' + px + '" y="' + (P.t) + '" width="' + barW + '" height="' + ch + '" fill="transparent" style="cursor:pointer;"/>';
		s += '</g>';

		// Month label
		s += '<text x="' + cx + '" y="' + (H - 18) + '" text-anchor="middle" fill="#64748b" font-size="9" font-weight="700">' + l + '</text>';

		// Value on top
		if (sv > 0) s += '<text x="' + (sx + barW / 2) + '" y="' + (yScale(sv) - 5) + '" text-anchor="middle" fill="#3b82f6" font-size="7" font-weight="700" opacity="0">' + oz_k(sv) + '</text>';
		if (pv > 0) s += '<text x="' + (px + barW / 2) + '" y="' + (yScale(pv) - 5) + '" text-anchor="middle" fill="#10b981" font-size="7" font-weight="700" opacity="0">' + oz_k(pv) + '</text>';
	});

	s += '</svg>';

	// Legend
	s += '<div style="display:flex;gap:16px;justify-content:center;margin-top:6px;">';
	s += '<div style="display:flex;align-items:center;gap:5px;"><div style="width:10px;height:10px;border-radius:3px;background:#3b82f6;"></div><span style="font-size:10px;font-weight:600;color:#64748b;">Sales</span></div>';
	s += '<div style="display:flex;align-items:center;gap:5px;"><div style="width:10px;height:10px;border-radius:3px;background:#10b981;"></div><span style="font-size:10px;font-weight:600;color:#64748b;">Procurement</span></div>';
	s += '</div>';

	container.innerHTML = s;

	// Tooltip logic
	var tip = tooltip;
	container.querySelectorAll('.oz-bar-group').forEach(function (g) {
		g.addEventListener('mouseenter', function (e) {
			var idx = parseInt(g.getAttribute('data-idx'));
			var type = g.getAttribute('data-type');
			var val = type === 'sales' ? sales[idx] : purchase[idx];
			var label = type === 'sales' ? 'Sales' : 'Procurement';
			var color = type === 'sales' ? '#3b82f6' : '#10b981';
			tip.innerHTML = '<div style="font-weight:800;color:' + color + ';">' + oz_k(val) + '</div><div style="color:#94a3b8;margin-top:2px;">' + label + ' · ' + labels[idx] + '</div>';
			var rect = g.getBoundingClientRect();
			var cRect = container.getBoundingClientRect();
			tip.style.left = (rect.left - cRect.left + rect.width / 2) + 'px';
			tip.style.top = (rect.top - cRect.top - 50) + 'px';
			tip.classList.add('show');
			// Highlight value text
			var texts = container.querySelectorAll('text');
			var txtIdx = idx * 2 + (type === 'purchase' ? 1 : 0);
		});
		g.addEventListener('mouseleave', function () {
			tip.classList.remove('show');
		});
	});
}

/* ═══════════ SVG CHARTS ═══════════ */

function oz_donut(el, data, size) {
	size = size || 130;
	var total = data.reduce(function (s, d) { return s + d.value; }, 0);
	if (total === 0) { el.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;">No data</div>'; return; }
	var r = (size - 16) / 2, c = 2 * Math.PI * r, ct = size / 2, cum = 0;
	var s = '<div style="position:relative;width:' + size + 'px;height:' + size + 'px;">';
	s += '<svg width="' + size + '" height="' + size + '" style="transform:rotate(-90deg);">';
	s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="#f1f5f9" stroke-width="14"/>';
	data.forEach(function (item) {
		var pct = item.value / total, adj = Math.max(0, pct - 0.02);
		var dash = c * adj + ' ' + (c * (1 - adj)), off = -c * cum;
		cum += pct;
		s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="' + item.color + '" stroke-width="14" stroke-dasharray="' + dash + '" stroke-dashoffset="' + off + '" stroke-linecap="round"><title>' + item.label + ': ' + item.value.toLocaleString() + '</title></circle>';
	});
	s += '</svg>';
	s += '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;"><span style="font-size:18px;font-weight:800;color:#1e293b;">' + total.toLocaleString() + '</span><span style="font-size:8px;font-weight:700;text-transform:uppercase;color:#94a3b8;">Total</span></div></div>';
	s += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;justify-content:center;">';
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
	s += '<defs><linearGradient id="oring"><stop offset="0%" stop-color="' + (c1 || '#3b82f6') + '"/><stop offset="100%" stop-color="' + (c2 || '#7c3aed') + '"/></linearGradient></defs>';
	s += '</svg>';
	s += '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;"><span style="font-size:20px;font-weight:800;color:#1e293b;">' + Math.round(pct) + '%</span></div></div>';
	el.innerHTML = s;
}

/* ═══════════ DATA LOADING ═══════════ */

function load_all_data() {
	var co = window.oz_company;
	var item = window.oz_item;
	var period = window.oz_period;
	var months = window.oz_months;

	var tag = document.getElementById('oz-filter-tag');
	var parts = [];
	if (co !== 'All') parts.push(co);
	if (item !== 'All') parts.push(item);
	if (parts.length === 0) { tag.textContent = 'All'; tag.style.background = '#eff6ff'; tag.style.color = '#3b82f6'; }
	else { tag.textContent = parts.join(' · '); tag.style.background = '#ecfdf5'; tag.style.color = '#059669'; }

	// Update period labels
	$('#oz-period-sales,#oz-period-proc').text(period);

	$('#oz-kpi-sales,#oz-kpi-proc,#oz-kpi-avail,#oz-kpi-reserved,#oz-kpi-neg,#oz-kpi-ict,#oz-kpi-ict2,#oz-kpi-reserved2,#oz-kpi-resqty').text('--');
	$('#oz-bar-chart,#oz-monthly-table,#oz-chart-donut,#oz-funnel-content,#oz-ring,#oz-mini-stats,#oz-table-res,#oz-table-ict,#oz-table-neg,#oz-activity,#oz-top-items,#oz-top-customers,#oz-company-compare,#oz-ict-chain,#oz-warehouse-table').html('<div style="text-align:center;padding:20px;color:#94a3b8;font-size:10px;">Loading...</div>');
	$('#oz-spark-sales,#oz-spark-proc,#oz-spark-ict').html('');

	var args = { company: co, item: item };

	/* ── KPIs ── */
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
			oz_count(document.getElementById('oz-kpi-ict'), Math.round(d.intercompany_volume), '', ' L');
			setTimeout(function () { document.getElementById('oz-kpi-ict').textContent = oz_n(d.intercompany_volume) + ' L'; }, 1300);
			oz_count(document.getElementById('oz-kpi-avail'), Math.round(d.available_stock), '', ' L');
			setTimeout(function () { document.getElementById('oz-kpi-avail').textContent = oz_n(d.available_stock) + ' L'; }, 1300);
			oz_count(document.getElementById('oz-kpi-reserved'), Math.round(d.reserved_stock), '', ' L');
			setTimeout(function () { document.getElementById('oz-kpi-reserved').textContent = oz_n(d.reserved_stock) + ' L'; }, 1300);
			oz_count(document.getElementById('oz-kpi-neg'), d.negative_alerts, '', '');
			setTimeout(function () { document.getElementById('oz-kpi-neg').textContent = d.negative_alerts + ' Alerts'; }, 1300);
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
				fh += '<span class="oz-badge" style="color:' + s.c + ';background:' + s.c + '12;">' + Math.round(s.p) + '%</span></div></div>';
				fh += '<div class="oz-funnel-bar"><div class="oz-funnel-fill" style="width:' + s.p + '%;background:linear-gradient(90deg,' + s.c + ',' + s.c + 'aa);"></div></div></div>';
			});
			$('#oz-funnel-content').html(fh);

			oz_ring(document.getElementById('oz-ring'), tot > 0 ? (d.reserved_stock / tot) * 100 : 0, '#3b82f6', '#7c3aed');

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
		args: $.extend({}, args, { months: months }),
		callback: function (r) {
			if (!r.message) return;
			var d = r.message;

			oz_build_bar_chart(document.getElementById('oz-bar-chart'), document.getElementById('oz-bar-tooltip'), d.labels, d.sales, d.purchase);

			// Sparklines
			oz_sparkline(document.getElementById('oz-spark-sales'), d.sales, '#3b82f6');
			oz_sparkline(document.getElementById('oz-spark-proc'), d.purchase, '#10b981');

			// Monthly table
			var th = '<table class="oz-table"><thead><tr><th>Month</th><th style="text-align:right;">Sales</th><th style="text-align:right;">Procurement</th><th style="text-align:right;">Difference</th><th style="text-align:right;">Margin %</th></tr></thead><tbody>';
			for (var i = 0; i < d.labels.length; i++) {
				var s = d.sales[i] || 0, p = d.purchase[i] || 0;
				var diff = s - p;
				var margin = s > 0 ? ((diff / s) * 100).toFixed(1) : '0.0';
				var dc = diff >= 0 ? '#059669' : '#dc2626';
				th += '<tr onclick="frappe.set_route(\'List\',\'Sales Invoice\')">';
				th += '<td style="font-weight:700;color:#1e293b;">' + d.labels[i] + '</td>';
				th += '<td style="text-align:right;font-weight:700;color:#3b82f6;">' + oz_k(s) + '</td>';
				th += '<td style="text-align:right;font-weight:700;color:#10b981;">' + oz_k(p) + '</td>';
				th += '<td style="text-align:right;font-weight:700;color:' + dc + ';">' + (diff >= 0 ? '+' : '') + oz_k(diff) + '</td>';
				th += '<td style="text-align:right;font-weight:700;color:' + dc + ';">' + margin + '%</td>';
				th += '</tr>';
			}
			th += '</tbody></table>';
			$('#oz-monthly-table').html(th);
		}
	});

	/* ── Top Items ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_top_items',
		args: $.extend({}, args, { period: period }),
		callback: function (r) {
			if (!r.message || !r.message.length) { $('#oz-top-items').html('<div style="text-align:center;padding:20px;color:#94a3b8;">No sales data</div>'); return; }
			var maxRev = r.message[0].total_revenue || 1;
			var h = '<table class="oz-table"><thead><tr><th>#</th><th>Item</th><th>Qty</th><th style="text-align:right;">Revenue</th><th style="width:100px;">Share</th></tr></thead><tbody>';
			r.message.forEach(function (row, i) {
				var pct = (row.total_revenue / maxRev) * 100;
				var rankColor = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : '#e2e8f0';
				var rankText = i === 0 ? '#fff' : i === 1 ? '#fff' : i === 2 ? '#fff' : '#94a3b8';
				h += '<tr>';
				h += '<td><span class="oz-rank" style="background:' + rankColor + ';color:' + rankText + ';">' + (i + 1) + '</span></td>';
				h += '<td style="font-weight:700;color:#1e293b;">' + row.item_code + '</td>';
				h += '<td>' + oz_n(row.total_qty) + '</td>';
				h += '<td style="text-align:right;font-weight:700;color:#3b82f6;">' + oz_k(row.total_revenue) + '</td>';
				h += '<td><div class="oz-prog"><div class="oz-prog-fill" style="width:' + pct + '%;background:linear-gradient(90deg,#3b82f6,#60a5fa);"></div></div></td>';
				h += '</tr>';
			});
			h += '</tbody></table>';
			$('#oz-top-items').html(h);
		}
	});

	/* ── Top Customers ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_top_customers',
		args: $.extend({}, args, { period: period }),
		callback: function (r) {
			if (!r.message || !r.message.length) { $('#oz-top-customers').html('<div style="text-align:center;padding:20px;color:#94a3b8;">No customer data</div>'); return; }
			var maxAmt = r.message[0].total_amount || 1;
			var h = '<table class="oz-table"><thead><tr><th>#</th><th>Customer</th><th>Inv</th><th style="text-align:right;">Amount</th><th style="width:100px;">Share</th></tr></thead><tbody>';
			r.message.forEach(function (row, i) {
				var pct = (row.total_amount / maxAmt) * 100;
				var rankColor = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : '#e2e8f0';
				var rankText = i === 0 ? '#fff' : i === 1 ? '#fff' : i === 2 ? '#fff' : '#94a3b8';
				h += '<tr>';
				h += '<td><span class="oz-rank" style="background:' + rankColor + ';color:' + rankText + ';">' + (i + 1) + '</span></td>';
				h += '<td style="font-weight:700;color:#1e293b;">' + (row.customer_name || row.customer) + '</td>';
				h += '<td>' + row.invoice_count + '</td>';
				h += '<td style="text-align:right;font-weight:700;color:#059669;">' + oz_k(row.total_amount) + '</td>';
				h += '<td><div class="oz-prog"><div class="oz-prog-fill" style="width:' + pct + '%;background:linear-gradient(90deg,#10b981,#34d399);"></div></div></td>';
				h += '</tr>';
			});
			h += '</tbody></table>';
			$('#oz-top-customers').html(h);
		}
	});

	/* ── Company Comparison ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_company_comparison',
		args: $.extend({}, args, { period: period }),
		callback: function (r) {
			if (!r.message) return;
			var data = r.message;
			var maxVal = Math.max.apply(null, data.map(function (d) { return Math.max(d.sales, d.purchase); })) || 1;
			var h = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">';
			var colors = { 'GE': { bg: '#eff6ff', accent: '#3b82f6' }, 'GEX': { bg: '#ecfdf5', accent: '#10b981' }, 'SHE': { bg: '#fef3c7', accent: '#f59e0b' } };
			data.forEach(function (d) {
				var c = colors[d.abbr] || colors['GE'];
				var salesPct = (d.sales / maxVal) * 100;
				var purchasePct = (d.purchase / maxVal) * 100;
				h += '<div style="background:' + c.bg + ';border-radius:12px;padding:16px;">';
				h += '<div style="font-size:14px;font-weight:800;color:' + c.accent + ';margin-bottom:12px;">' + d.abbr + '<span style="font-size:9px;font-weight:600;color:#94a3b8;margin-left:4px;">' + d.company + '</span></div>';
				h += '<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;font-size:9px;font-weight:700;color:#64748b;margin-bottom:3px;"><span>Sales</span><span>' + oz_k(d.sales) + '</span></div>';
				h += '<div class="oz-prog"><div class="oz-prog-fill" style="width:' + salesPct + '%;background:#3b82f6;"></div></div></div>';
				h += '<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;font-size:9px;font-weight:700;color:#64748b;margin-bottom:3px;"><span>Procurement</span><span>' + oz_k(d.purchase) + '</span></div>';
				h += '<div class="oz-prog"><div class="oz-prog-fill" style="width:' + purchasePct + '%;background:#10b981;"></div></div></div>';
				h += '<div><div style="display:flex;justify-content:space-between;font-size:9px;font-weight:700;color:#64748b;margin-bottom:3px;"><span>Stock</span><span>' + oz_n(d.stock) + ' L</span></div>';
				h += '<div class="oz-prog"><div class="oz-prog-fill" style="width:' + ((d.stock / (maxVal || 1)) * 100) + '%;background:#7c3aed;"></div></div></div>';
				h += '</div>';
			});
			h += '</div>';
			$('#oz-company-compare').html(h);
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
			if (!r.message || !r.message.length) { $el.html('<div style="text-align:center;padding:20px;color:#94a3b8;">No active reservations</div>'); return; }
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
			oz_count(document.getElementById('oz-kpi-reserved2'), r.message.length, '', '');
			setTimeout(function () { document.getElementById('oz-kpi-reserved2').textContent = r.message.length + ' Active'; }, 1300);
			oz_count(document.getElementById('oz-kpi-resqty'), Math.round(totalQty), '', ' L');
			setTimeout(function () { document.getElementById('oz-kpi-resqty').textContent = oz_n(totalQty) + ' L'; }, 1300);
		}
	});

	/* ── ICT Chain ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_ict_chain',
		args: args,
		callback: function (r) {
			if (!r.message || !r.message.length) { $('#oz-ict-chain').html('<div style="text-align:center;padding:20px;color:#94a3b8;">No ICT data</div>'); return; }
			var h = '';
			r.message.forEach(function (row) {
				h += '<div style="border:1px solid #f1f5f9;border-radius:10px;padding:12px;margin-bottom:8px;cursor:pointer;transition:all 0.15s;" onmouseenter="this.style.borderColor=\'#bfdbfe\'" onmouseleave="this.style.borderColor=\'#f1f5f9\'" onclick="frappe.set_route(\'Form\',\'Inter Company Transfer\',\'' + row.name + '\')">';
				h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">';
				h += '<span style="font-weight:700;color:#0891b2;font-size:11px;">' + row.name + '</span>';
				h += '<span class="oz-badge" style="color:#059669;background:#ecfdf5;">' + oz_k(row.grand_total) + '</span></div>';
				h += '<div class="oz-chain">';
				h += '<span class="oz-chain-step oz-chain-active">' + (row.company || '') + '</span>';
				h += '<span class="oz-chain-arrow">→</span>';
				h += '<span class="oz-chain-step oz-chain-active">' + (row.to_company || '') + '</span>';
				h += '<span style="margin-left:auto;font-size:9px;color:#94a3b8;">' + (row.items || '') + '</span></div>';
				h += '<div style="display:flex;gap:12px;font-size:9px;color:#94a3b8;margin-top:4px;">';
				h += '<span>' + oz_n(row.total_qty) + ' L</span>';
				h += '<span>' + (row.item_count || 0) + ' items</span>';
				h += '<span>' + frappe.datetime.str_to_user(row.posting_date) + '</span>';
				h += '<span class="oz-badge" style="color:#0891b2;background:#ecfeff;">' + (row.status || '') + '</span></div>';
				h += '</div>';
			});
			$('#oz-ict-chain').html(h);
		}
	});

	/* ── ICT Table ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_recent_icts',
		args: args,
		callback: function (r) {
			if (!r.message || !r.message.length) { $('#oz-table-ict').html('<div style="text-align:center;padding:20px;color:#94a3b8;">No transfers yet</div>'); return; }
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
			if (!r.message || !r.message.length) { $('#oz-table-neg').html('<div style="text-align:center;padding:20px;color:#059669;font-weight:600;">✓ All clear — no negative stock</div>'); return; }
			var h = '<table class="oz-table"><thead><tr><th>Company</th><th>Warehouse</th><th>Item</th><th>Neg Qty</th><th>Value</th></tr></thead><tbody>';
			r.message.forEach(function (row) {
				h += '<tr onclick="frappe.set_route(\'Form\',\'Bin\',\'' + row.warehouse + '/' + row.item_code + '\')">';
				h += '<td>' + (row.company || '') + '</td>';
				h += '<td>' + (row.warehouse || '') + '</td>';
				h += '<td style="font-weight:700;">' + (row.item_code || '') + '</td>';
				h += '<td style="font-weight:800;color:#dc2626;">' + oz_n(row.actual_qty) + '</td>';
				h += '<td style="font-weight:700;color:#dc2626;">' + oz_k(row.stock_value) + '</td></tr>';
			});
			h += '</tbody></table>';
			$('#oz-table-neg').html(h);
		}
	});

	/* ── Warehouse Stock ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_warehouse_stock',
		args: args,
		callback: function (r) {
			if (!r.message || !r.message.length) { $('#oz-warehouse-table').html('<div style="text-align:center;padding:20px;color:#94a3b8;">No warehouse data</div>'); return; }
			var maxQty = Math.max.apply(null, r.message.map(function (d) { return Math.abs(d.total_qty); })) || 1;
			var h = '<table class="oz-table"><thead><tr><th>Warehouse</th><th>Company</th><th>Items</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Value</th><th style="width:120px;">Fill</th></tr></thead><tbody>';
			r.message.forEach(function (row) {
				var pct = (Math.abs(row.total_qty) / maxQty) * 100;
				var qtyColor = row.total_qty < 0 ? '#dc2626' : '#1e293b';
				h += '<tr onclick="frappe.set_route(\'Form\',\'Warehouse\',\'' + row.warehouse + '\')">';
				h += '<td style="font-weight:700;color:#1e293b;">' + (row.warehouse || '') + '</td>';
				h += '<td><span class="oz-badge" style="color:#0891b2;background:#ecfeff;">' + (row.company || '') + '</span></td>';
				h += '<td>' + row.item_count + '</td>';
				h += '<td style="text-align:right;font-weight:800;color:' + qtyColor + ';">' + oz_n(row.total_qty) + '</td>';
				h += '<td style="text-align:right;font-weight:700;color:#059669;">' + oz_k(row.total_value) + '</td>';
				h += '<td><div class="oz-prog"><div class="oz-prog-fill" style="width:' + pct + '%;background:' + (row.total_qty < 0 ? '#dc2626' : '#3b82f6') + ';"></div></div></td>';
				h += '</tr>';
			});
			h += '</tbody></table>';
			$('#oz-warehouse-table').html(h);
		}
	});

	/* ── Activity Feed ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_recent_icts',
		args: args,
		callback: function (r) {
			if (!r.message || !r.message.length) { $('#oz-activity').html('<div style="text-align:center;padding:20px;color:#94a3b8;">No recent activity</div>'); return; }
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
