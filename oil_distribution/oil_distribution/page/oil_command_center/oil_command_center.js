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

	// Generate FY options (last 5 financial years)
	var now = new Date();
	var curM = now.getMonth();
	var curYr = now.getFullYear();
	var curFYStart = curM >= 3 ? curYr : curYr - 1;
	var curFYValue = curFYStart + '-04-01_' + (curFYStart + 1) + '-03-31';
	window.oz_fy = curFYValue;
	var fyOptions = [];
	for (var i = 0; i < 5; i++) {
		var sy = curFYStart - i;
		var ey = sy + 1;
		fyOptions.push({
			value: sy + '-04-01_' + ey + '-03-31',
			label: 'FY ' + sy + '-' + String(ey).slice(-2),
			abbr: sy + '-' + ey
		});
	}
	window.oz_fy_options = fyOptions;
	window.oz_kpi_data = {};  // Store KPI data for sparkline with %

	// Tabs
	page.main.find('.oz-tab-btn').on('click', function () {
		var tab = $(this).data('tab');
		window.oz_tab = tab;
		page.main.find('.oz-tab-btn').removeClass('oz-tab-active');
		$(this).addClass('oz-tab-active');
		page.main.find('.oz-tab-panel').hide();
		page.main.find('#oz-panel-' + tab).show();
		// Show period bar only for Sales tab
		$('#oz-period-bar').toggle(tab === 'sales');
	});

	// Period buttons
	window.oz_selected_months = [];
	window.oz_selected_qtrs = [1];
	window.oz_selected_ytd_fys = [];

	page.main.find('.oz-period-btn').on('click', function () {
		page.main.find('.oz-period-btn').removeClass('oz-period-active');
		$(this).addClass('oz-period-active');
		window.oz_period = $(this).data('period');
		// Show/hide controls
		$('#oz-month-controls').toggle(window.oz_period === 'MTD');
		$('#oz-qtr-controls').toggle(window.oz_period === 'QTD');
		$('#oz-ytd-controls').toggle(window.oz_period === 'YTD');
		// Set default compare selection and show/hide vs: controls
		oz_set_default_compare();
		load_all_data();
	});

	// Compare dropdown handlers
	function oz_set_default_compare() {
		var months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
		var compareControls = document.getElementById('oz-compare-controls');
		if (window.oz_period === 'MTD') {
			var sel = window.oz_selected_months || [];
			if (sel.length === 1) {
				var prev = sel[0] - 1;
				if (prev < 0) prev = 11;
				oz_set_compare('oz-compare-month', String(prev));
				window.oz_compare_month = String(prev);
				if (compareControls) compareControls.style.display = '';
			} else {
				oz_set_compare('oz-compare-month', '');
				window.oz_compare_month = '';
				if (compareControls) compareControls.style.display = 'none';
			}
		} else if (window.oz_period === 'QTD') {
			var selQ = window.oz_selected_qtrs || [];
			if (selQ.length === 1) {
				var prevQ = selQ[0] - 1;
				if (prevQ < 1) prevQ = 4;
				oz_set_compare('oz-compare-qtr', String(prevQ));
				window.oz_compare_qtr = String(prevQ);
				if (compareControls) compareControls.style.display = '';
			} else {
				oz_set_compare('oz-compare-qtr', '');
				window.oz_compare_qtr = '';
				if (compareControls) compareControls.style.display = 'none';
			}
		} else if (window.oz_period === 'YTD') {
			var selFY = window.oz_selected_ytd_fys || [];
			if (selFY.length === 1) {
				var parts = selFY[0].split('_');
				if (parts.length === 2) {
					var s = new Date(parts[0]);
					var prevFY = (s.getFullYear() - 1) + '-04-01_' + s.getFullYear() + '-03-31';
					oz_set_compare('oz-compare-fy', prevFY);
					window.oz_compare_fy = prevFY;
				}
				if (compareControls) compareControls.style.display = '';
			} else {
				oz_set_compare('oz-compare-fy', '');
				window.oz_compare_fy = '';
				if (compareControls) compareControls.style.display = 'none';
			}
		}
		// Also show/hide the correct compare dropdown within the controls
		$('#oz-compare-month').toggle(window.oz_period === 'MTD');
		$('#oz-compare-qtr').toggle(window.oz_period === 'QTD');
		$('#oz-compare-fy').toggle(window.oz_period === 'YTD');
	}

	// Populate compare month dropdown
	function oz_populate_compare_months() {
		var months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
		var opts = months.map(function (m, i) { return { value: String(i), label: m }; });
		oz_init_compare('oz-compare-month', opts, function (val) {
			window.oz_compare_month = val;
			load_all_data();
		});
	}

	// Populate compare quarter dropdown
	function oz_populate_compare_qtrs() {
		var opts = [
			{ value: '1', label: 'Q1 (Apr-Jun)' },
			{ value: '2', label: 'Q2 (Jul-Sep)' },
			{ value: '3', label: 'Q3 (Oct-Dec)' },
			{ value: '4', label: 'Q4 (Jan-Mar)' }
		];
		oz_init_compare('oz-compare-qtr', opts, function (val) {
			window.oz_compare_qtr = val;
			load_all_data();
		});
	}

	// Populate compare FY dropdown
	function oz_populate_compare_fys() {
		oz_init_compare('oz-compare-fy', window.oz_fy_options || [], function (val) {
			window.oz_compare_fy = val;
			load_all_data();
		});
	}

	// Initialize compare dropdowns
	oz_populate_compare_months();
	oz_populate_compare_qtrs();
	oz_populate_compare_fys();

	window.oz_compare_month = '';
	window.oz_compare_qtr = '';
	window.oz_compare_fy = '';

	// Render month chips (does NOT reset selection)
	function oz_render_month_chips() {
		var months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
		var container = document.getElementById('oz-month-chips');
		if (!container) return;
		var html = '';
		months.forEach(function (m, i) {
			var active = window.oz_selected_months.indexOf(i) !== -1 ? 'oz-month-chip-active' : '';
			html += '<span class="oz-month-chip ' + active + '" data-idx="' + i + '">' + m + '</span>';
		});
		container.innerHTML = html;
		// Bind clicks
		container.querySelectorAll('.oz-month-chip').forEach(function (chip) {
			chip.addEventListener('click', function () {
				var idx = parseInt(this.getAttribute('data-idx'));
				var pos = window.oz_selected_months.indexOf(idx);
				if (pos !== -1) {
					if (window.oz_selected_months.length > 1) {
						window.oz_selected_months.splice(pos, 1);
					}
				} else {
					window.oz_selected_months.push(idx);
				}
				oz_render_month_chips();
				oz_set_default_compare();
				load_all_data();
			});
		});
	}

	// Init month chips (sets default selection)
	function oz_init_month_chips() {
		var fy = window.oz_fy;
		var now = new Date();
		var curMonth = now.getMonth();
		var fyMonthIdx = (curMonth - 3 + 12) % 12;
		if (fy !== 'All' && fy.indexOf(',') === -1) {
			var fyParts = fy.split('_');
			if (fyParts.length === 2) {
				var fyStartDate = new Date(fyParts[0]);
				var fyEndDate = new Date(fyParts[1]);
				if (now < fyStartDate || now > fyEndDate) {
					fyMonthIdx = 0;
				}
			}
		}
		window.oz_selected_months = [fyMonthIdx];
		oz_render_month_chips();
	}

	// Render quarter chips (does NOT reset selection)
	function oz_render_qtr_chips() {
		var quarters = [
			{ q: 1, label: 'Q1', months: 'Apr-Jun' },
			{ q: 2, label: 'Q2', months: 'Jul-Sep' },
			{ q: 3, label: 'Q3', months: 'Oct-Dec' },
			{ q: 4, label: 'Q4', months: 'Jan-Mar' }
		];
		var container = document.getElementById('oz-qtr-chips');
		if (!container) return;
		var html = '';
		quarters.forEach(function (q) {
			var active = window.oz_selected_qtrs.indexOf(q.q) !== -1 ? 'oz-qtr-chip-active' : '';
			html += '<span class="oz-qtr-chip ' + active + '" data-q="' + q.q + '" title="' + q.months + '">' + q.label + '</span>';
		});
		container.innerHTML = html;
		// Bind clicks
		container.querySelectorAll('.oz-qtr-chip').forEach(function (chip) {
			chip.addEventListener('click', function () {
				var q = parseInt(this.getAttribute('data-q'));
				var pos = window.oz_selected_qtrs.indexOf(q);
				if (pos !== -1) {
					if (window.oz_selected_qtrs.length > 1) {
						window.oz_selected_qtrs.splice(pos, 1);
					}
				} else {
					window.oz_selected_qtrs.push(q);
				}
				oz_render_qtr_chips();
				oz_set_default_compare();
				load_all_data();
			});
		});
	}

	// Init quarter chips (sets default selection)
	function oz_init_qtr_chips() {
		// Determine current quarter based on FY
		var now = new Date();
		var curMonth = now.getMonth(); // 0-11
		// FY month 0=Apr, 1=May, ..., 11=Mar
		var fyMonthIdx = (curMonth - 3 + 12) % 12;
		var curQtr = Math.floor(fyMonthIdx / 3) + 1; // 1,2,3,4
		window.oz_selected_qtrs = [curQtr];
		oz_render_qtr_chips();
	}

	// Render YTD FY chips (does NOT reset selection)
	function oz_render_ytd_chips() {
		var container = document.getElementById('oz-ytd-chips');
		if (!container) return;
		var fyOptions = window.oz_fy_options || [];
		var html = '';
		fyOptions.forEach(function (fy) {
			var active = window.oz_selected_ytd_fys.indexOf(fy.value) !== -1 ? 'oz-month-chip-active' : '';
			html += '<span class="oz-month-chip ' + active + '" data-fy="' + fy.value + '">' + fy.label + '</span>';
		});
		container.innerHTML = html;
		// Bind clicks
		container.querySelectorAll('.oz-month-chip').forEach(function (chip) {
			chip.addEventListener('click', function () {
				var fy = this.getAttribute('data-fy');
				var pos = window.oz_selected_ytd_fys.indexOf(fy);
				if (pos !== -1) {
					if (window.oz_selected_ytd_fys.length > 1) {
						window.oz_selected_ytd_fys.splice(pos, 1);
					}
				} else {
					window.oz_selected_ytd_fys.push(fy);
				}
				oz_render_ytd_chips();
				oz_set_default_compare();
				load_all_data();
			});
		});
	}

	// Init YTD FY chips (sets default selection)
	function oz_init_ytd_chips() {
		window.oz_selected_ytd_fys = [window.oz_fy];
		oz_render_ytd_chips();
	}

	// Init all period controls
	oz_init_month_chips();
	oz_init_qtr_chips();
	oz_init_ytd_chips();
	// Set default compare on page load
	oz_set_default_compare();

	// Init company multi-select
	oz_init_multi('oz-ms-company', [
		{ value: 'Geeta Enterprise', label: 'Geeta Enterprise', abbr: 'GE' },
		{ value: 'Global Export', label: 'Global Export', abbr: 'GEX' },
		{ value: 'Shubham Enterprise', label: 'Shubham Enterprise', abbr: 'SHE' }
	], function (selected) {
		var allCo = ['Geeta Enterprise', 'Global Export', 'Shubham Enterprise'];
		var allSelected = selected.length === 0 || selected.length === allCo.length;
		window.oz_company = allSelected ? 'All' : selected.join(',');
		oz_update_filter_tag();
		load_all_data();
	});

	// Init item multi-select (empty, populated async)
	oz_init_multi('oz-ms-item', [], function (selected) {
		var totalItems = (window.oz_item_options || []).length;
		var allSelected = selected.length === 0 || (totalItems > 0 && selected.length === totalItems);
		window.oz_item = allSelected ? 'All' : selected.join(',');
		oz_update_filter_tag();
		load_all_data();
	});

	// Init FY multi-select (default: current FY only)
	oz_init_multi('oz-ms-fy', window.oz_fy_options, function (selected) {
		var allFy = window.oz_fy_options.map(function (o) { return o.value; });
		var allSelected = selected.length === 0 || selected.length === allFy.length;
		window.oz_fy = allSelected ? 'All' : selected.join(',');
		oz_update_filter_tag();
		// Re-init period controls for new FY
		if (window.oz_period === 'MTD') oz_init_month_chips();
		if (window.oz_period === 'YTD') oz_init_ytd_chips();
		load_all_data();
	}, [curFYValue]);

	// Populate items
	frappe.xcall('frappe.client.get_list', { doctype: 'Item', fields: ['item_code', 'item_name'], limit_page_length: 0, order_by: 'item_code asc' }).then(function (items) {
		if (!items) return;
		var opts = items.map(function (item) { return { value: item.item_code, label: item.item_code + ' — ' + item.item_name }; });
		window.oz_item_options = opts;
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

		.top-bars { position: sticky; top: var(--page-head-height, 48px); z-index: 50; background: #f0f4f8; border-radius: 14px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 6px; padding: 6px; }

		/* Bar */
		.oz-bar { display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; flex-wrap: wrap; }
		.oz-bar label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; display: flex; align-items: center; line-height: 1; margin: 0; }
		.oz-bar select { padding: 5px 26px 5px 8px; border-radius: 7px; border: 1px solid #e2e8f0; background: #f8fafc; color: #334155; font-size: 11px; font-weight: 600; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%2394a3b8'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 7px center; }
		.oz-bar select:focus { outline: none; border-color: #3b82f6; }
		.oz-filter-tag { font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 6px; background: #eff6ff; color: #3b82f6; white-space: nowrap; }

		/* Tabs */
		.oz-tabs { display: flex; gap: 2px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 3px; width: fit-content; }
		.oz-tab-btn { padding: 6px 16px; border-radius: 8px; border: none; background: transparent; font-size: 11px; font-weight: 700; cursor: pointer; color: #94a3b8; transition: all 0.2s; }
		.oz-tab-btn:hover { color: #475569; background: #f8fafc; }
		.oz-tab-active { background: #3b82f6 !important; color: #fff !important; }
		/* Period */
		.oz-period-bar { }
		.oz-period-btn { padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 9px; font-weight: 700; cursor: pointer; color: #94a3b8; transition: all 0.2s; }
		.oz-period-btn:hover { border-color: #3b82f6; color: #3b82f6; }
		.oz-period-active { background: #3b82f6 !important; color: #fff !important; border-color: #3b82f6 !important; }
		.oz-period-controls { display: flex; align-items: center; gap: 8px; margin-left: 16px; }
		.oz-month-chip { padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 9px; font-weight: 700; cursor: pointer; color: #94a3b8; transition: all 0.2s; }
		.oz-month-chip:hover { border-color: #3b82f6; color: #3b82f6; }
		.oz-month-chip-active { background: #dbeafe !important; color: #3b82f6 !important; border-color: #3b82f6 !important; }
		.oz-qtr-chip { padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 9px; font-weight: 700; cursor: pointer; color: #94a3b8; transition: all 0.2s; }
		.oz-qtr-chip:hover { border-color: #3b82f6; color: #3b82f6; }
		.oz-qtr-chip-active { background: #d1fae5 !important; color: #059669 !important; border-color: #059669 !important; }

		/* KPI */
		.oz-kpi-row { display: grid; gap: 10px; margin-bottom: 14px; }
		.oz-kpi-row-3 { grid-template-columns: repeat(3, 1fr); }
		.oz-kpi-row-2 { grid-template-columns: repeat(2, 1fr); }
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

		/* Compare single-select dropdown */
		.oz-cs { position: relative; display: inline-block; }
		.oz-cs-btn {
			display: flex; align-items: center; gap: 6px;
			padding: 4px 24px 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0;
			background: #f8fafc; color: #64748b; font-size: 9px; font-weight: 700;
			cursor: pointer; min-width: 80px; white-space: nowrap;
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%2394a3b8'/%3E%3C/svg%3E");
			background-repeat: no-repeat; background-position: right 8px center;
			transition: all 0.2s;
		}
		.oz-cs-btn:hover { border-color: #3b82f6; color: #3b82f6; background-color: #fff; }
		.oz-cs-btn.oz-cs-open { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); background-color: #fff; color: #1e293b; }
		.oz-cs-panel {
			display: none; position: fixed; z-index: 9999;
			min-width: 140px; max-height: 240px; overflow-y: auto;
			background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
			box-shadow: 0 8px 24px rgba(0,20,40,0.12); padding: 4px;
		}
		.oz-cs-panel.oz-cs-show { display: block; }
		.oz-cs-opt {
			display: flex; align-items: center; padding: 6px 10px;
			border-radius: 6px; cursor: pointer; transition: background 0.1s;
			font-size: 10px; font-weight: 600; color: #475569;
		}
		.oz-cs-opt:hover { background: #f1f5f9; color: #1e293b; }
		.oz-cs-opt.oz-cs-selected { background: #eff6ff; color: #3b82f6; font-weight: 700; }
		.oz-period-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }

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
		.oz-tip { position: fixed; background: #1e293b; color: #fff; padding: 10px 14px; border-radius: 10px; font-size: 10px; pointer-events: none; z-index: 9999; white-space: nowrap; box-shadow: 0 12px 32px rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); opacity: 0; transition: opacity 0.15s; }
		.oz-tip.show { opacity: 1; }
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
		.oz-ms-btn .oz-ms-count { background: #059669; color: #fff; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 10px; }
		.oz-ms-panel {
			display: none; position: fixed; z-index: 9999;
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
		<div class="top-bars">
		<div class="oz-bar oz-anim">
			<label>Company</label>
			<div id="oz-ms-company" class="oz-ms"></div>
			<label style="margin-left:8px;">Item</label>
			<div id="oz-ms-item" class="oz-ms" style="min-width:200px;"></div>
			<label style="margin-left:8px;">FY</label>
			<div id="oz-ms-fy" class="oz-ms" style="min-width:180px;"></div>
			<div style="margin-left:auto;display:flex;gap:6px;flex-shrink:0;">
				<span id="oz-filter-company" class="oz-filter-tag"></span>
				<span id="oz-filter-fy" class="oz-filter-tag"></span>
			</div>
		</div>

		<!-- TABS -->
		<div class="oz-tabs oz-anim" style="animation-delay:0.04s">
			<button class="oz-tab-btn oz-tab-active" data-tab="sales">Sales & Procurement</button>
			<button class="oz-tab-btn" data-tab="stock">Stock Intelligence</button>
			<button class="oz-tab-btn" data-tab="ict">Inter Company Transfer</button>
			<button class="oz-tab-btn" data-tab="reservations">Reservations</button>
		</div>
		<!-- Period Selector -->
		<div id="oz-period-bar" class="oz-bar oz-period-bar oz-anim" style="animation-delay:0.06s;">
			<label>Period</label>
			<button class="oz-period-btn oz-period-active" data-period="MTD">MTD</button>
			<button class="oz-period-btn" data-period="QTD">QTD</button>
			<button class="oz-period-btn" data-period="YTD">YTD</button>
			<!-- MTD: Month chips (Apr-Mar of FY) -->
			<div id="oz-month-controls" class="oz-period-controls">
				<span class="oz-period-label">Months:</span>
				<div id="oz-month-chips" style="display:flex;gap:4px;flex-wrap:wrap;"></div>
			</div>
			<!-- QTD: Quarter chips -->
			<div id="oz-qtr-controls" class="oz-period-controls" style="display:none;">
				<span class="oz-period-label">Quarters:</span>
				<div id="oz-qtr-chips" style="display:flex;gap:4px;flex-wrap:wrap;"></div>
			</div>
			<!-- YTD: FY selector (only if multiple FYs) -->
			<div id="oz-ytd-controls" class="oz-period-controls" style="display:none;">
				<span class="oz-period-label">FY:</span>
				<div id="oz-ytd-chips" style="display:flex;gap:4px;flex-wrap:wrap;"></div>
			</div>
			<!-- Compare With selector -->
			<div id="oz-compare-controls" class="oz-period-controls" style="display:flex;align-items:center;gap:8px;">
				<span class="oz-period-label">vs:</span>
				<div id="oz-compare-month" class="oz-cs"></div>
				<div id="oz-compare-qtr" class="oz-cs" style="display:none;"></div>
				<div id="oz-compare-fy" class="oz-cs" style="display:none;"></div>
			</div>
		</div>
</div>
		<!-- ═══ PANEL 1: SALES & PROCUREMENT ═══ -->
		<div id="oz-panel-sales" class="oz-tab-panel">

			<!-- KPIs with company breakdown -->
			<div class="oz-kpi-row oz-kpi-row-3 oz-anim" style="animation-delay:0.08s">
				<!-- Sales Card -->
				<div class="oz-kpi-card" style="flex-direction:column;align-items:stretch;cursor:pointer;" onclick="frappe.set_route('List','Sales Invoice')">
					<div style="display:flex;align-items:center;gap:12px;">
						<div class="oz-kpi-icon" style="background:#dbeafe;color:#3b82f6;">₹</div>
						<div class="oz-kpi-info">
							<div style="display:flex;align-items:center;gap:6px;">
								<div class="oz-kpi-val" id="oz-kpi-sales" style="color:#3b82f6;">--</div>
								<span id="oz-kpi-sales-change" style="font-size:9px;font-weight:700;"></span>
							</div>
							<div class="oz-kpi-lbl">Sales <span id="oz-period-sales" style="color:#3b82f6;">MTD</span></div>
						</div>
						<div class="oz-kpi-spark" id="oz-spark-sales"></div>
					</div>
					<div id="oz-sales-breakdown" style="margin-top:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;"></div>
				</div>
				<!-- Procurement Card -->
				<div class="oz-kpi-card" style="flex-direction:column;align-items:stretch;cursor:pointer;" onclick="frappe.set_route('List','Purchase Invoice')">
					<div style="display:flex;align-items:center;gap:12px;">
						<div class="oz-kpi-icon" style="background:#d1fae5;color:#059669;">₹</div>
						<div class="oz-kpi-info">
							<div style="display:flex;align-items:center;gap:6px;">
								<div class="oz-kpi-val" id="oz-kpi-proc" style="color:#059669;">--</div>
								<span id="oz-kpi-proc-change" style="font-size:9px;font-weight:700;"></span>
							</div>
							<div class="oz-kpi-lbl">Procurement <span id="oz-period-proc" style="color:#059669;">MTD</span></div>
						</div>
						<div class="oz-kpi-spark" id="oz-spark-proc"></div>
					</div>
					<div id="oz-proc-breakdown" style="margin-top:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;"></div>
				</div>
				<!-- Profit/Loss Card -->
				<div class="oz-kpi-card" style="flex-direction:column;align-items:stretch;cursor:pointer;" onclick="frappe.set_route('Profit and Loss Statement')">
					<div style="display:flex;align-items:center;gap:12px;">
						<div class="oz-kpi-icon" id="oz-kpi-pl-icon" style="background:#fef3c7;color:#d97706;">₹</div>
						<div class="oz-kpi-info">
							<div style="display:flex;align-items:center;gap:6px;">
								<div class="oz-kpi-val" id="oz-kpi-pl" style="color:#d97706;">--</div>
								<span id="oz-kpi-pl-change" style="font-size:9px;font-weight:700;"></span>
							</div>
							<div class="oz-kpi-lbl">Profit / Loss <span id="oz-period-pl" style="color:#d97706;">MTD</span></div>
						</div>
						<div class="oz-kpi-spark" id="oz-spark-pl"></div>
					</div>
					<div id="oz-pl-breakdown" style="margin-top:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;"></div>
				</div>
			</div>

			<!-- Bar Chart -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.12s">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#dbeafe;color:#3b82f6;">📊</div>
					<div style="flex:1;">
						<div class="oz-chart-title">Monthly Sales vs Procurement</div>
						<div class="oz-chart-sub">Hover for details</div>
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

			<!-- KPIs + Compact Pipeline in one row -->
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

			<!-- Compact Pipeline + Utilization + Quick Stats -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.1s;padding:14px 18px;">
				<div style="display:flex;align-items:center;gap:16px;">
					<div style="flex:1;">
						<div style="font-size:11px;font-weight:700;color:#1e293b;margin-bottom:8px;">Stock Pipeline</div>
						<div id="oz-funnel-content"></div>
					</div>
					<div style="width:1px;height:80px;background:#f1f5f9;"></div>
					<div style="text-align:center;min-width:80px;">
						<div id="oz-ring" style="display:flex;justify-content:center;"></div>
						<div style="font-size:8px;font-weight:700;color:#94a3b8;margin-top:2px;">Utilization</div>
					</div>
					<div style="width:1px;height:80px;background:#f1f5f9;"></div>
					<div style="min-width:140px;">
						<div id="oz-mini-stats"></div>
					</div>
				</div>
			</div>

			<!-- Donut + Negative Alerts -->
			<div class="oz-grid-2 oz-anim" style="animation-delay:0.14s">
				<div class="oz-chart-card" style="margin-bottom:0;">
					<div class="oz-chart-head">
						<div class="oz-chart-icon" style="background:#ede9fe;color:#7c3aed;">💡</div>
						<div><div class="oz-chart-title">Stock Distribution</div><div class="oz-chart-sub">Hover segments for details · Click legend to highlight</div></div>
					</div>
					<div id="oz-chart-donut"></div>
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

		<!-- ═══ PANEL 3: ICT ═══ -->
		<div id="oz-panel-ict" class="oz-tab-panel" style="display:none;">

			<!-- ICT KPIs Row 1: Volume, Count, Value -->
			<div class="oz-kpi-row oz-kpi-row-3 oz-anim" style="animation-delay:0.06s">
				<div class="oz-kpi-card" onclick="frappe.set_route('List','Inter Company Transfer',{docstatus:1})">
					<div class="oz-kpi-icon" style="background:#cffafe;color:#0891b2;">🔄</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-ict2" style="color:#0891b2;">--</div>
						<div class="oz-kpi-lbl">ICT Volume MTD</div>
					</div>
				</div>
				<div class="oz-kpi-card" onclick="frappe.set_route('List','Inter Company Transfer',{docstatus:1})">
					<div class="oz-kpi-icon" style="background:#cffafe;color:#0891b2;">📋</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-ict-count" style="color:#0891b2;">--</div>
						<div class="oz-kpi-lbl">ICT Count MTD</div>
					</div>
				</div>
				<div class="oz-kpi-card" onclick="frappe.set_route('List','Inter Company Transfer',{docstatus:1})">
					<div class="oz-kpi-icon" style="background:#cffafe;color:#0891b2;">💰</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-ict-val" style="color:#0891b2;">--</div>
						<div class="oz-kpi-lbl">ICT Value MTD</div>
					</div>
				</div>
			</div>

			<!-- Routes Breakdown -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.1s;">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#f0fdf4;color:#16a34a;">🔀</div>
					<div><div class="oz-chart-title">Routes Breakdown</div><div class="oz-chart-sub">Transfers between companies</div></div>
				</div>
				<div id="oz-routes-breakdown"></div>
			</div>


			<!-- ICT Chain Visualization -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.12s">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#cffafe;color:#0891b2;">🔗</div>
					<div style="flex:1;"><div class="oz-chart-title">ICT Chain Detail</div><div class="oz-chart-sub">Transfer items and status</div></div>
				</div>
				<div id="oz-ict-chain"></div>
			</div>

			<!-- ICT Table -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.14s">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#cffafe;color:#0891b2;">🔄</div>
					<div style="flex:1;"><div class="oz-chart-title">Recent Transfers</div></div>
					<a class="oz-link" onclick="frappe.set_route('List','Inter Company Transfer')">View All →</a>
				</div>
				<div id="oz-table-ict"></div>
			</div>

			<!-- Activity Feed -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.18s">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#ede9fe;color:#7c3aed;">☁</div>
					<div><div class="oz-chart-title">Activity Feed</div></div>
				</div>
				<div id="oz-activity"></div>
			</div>
		</div>

		<!-- ═══ PANEL: RESERVATIONS ═══ -->
		<div id="oz-panel-reservations" class="oz-tab-panel" style="display:none;">

			<!-- Reservations KPIs Row 1 -->
			<div class="oz-kpi-row oz-kpi-row-3 oz-anim" style="animation-delay:0.06s">
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
				<div class="oz-kpi-card" onclick="frappe.set_route('List','Stock Reservation',{status:'Reserved'})">
					<div class="oz-kpi-icon" style="background:#d1fae5;color:#059669;">💰</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-res-val" style="color:#059669;">--</div>
						<div class="oz-kpi-lbl">Reserved Value</div>
					</div>
				</div>
			</div>

			<!-- Reservations KPIs Row 2 -->
			<div class="oz-kpi-row oz-kpi-row-3 oz-anim" style="animation-delay:0.08s">
				<div class="oz-kpi-card">
					<div class="oz-kpi-icon" style="background:#dbeafe;color:#3b82f6;">📦</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-res-items" style="color:#3b82f6;">--</div>
						<div class="oz-kpi-lbl">Reserved Items</div>
					</div>
				</div>
				<div class="oz-kpi-card">
					<div class="oz-kpi-icon" style="background:#fce7f3;color:#db2777;">📈</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-res-util" style="color:#db2777;">--</div>
						<div class="oz-kpi-lbl">Utilization</div>
					</div>
				</div>
				<div class="oz-kpi-card">
					<div class="oz-kpi-icon" style="background:#ecfeff;color:#0891b2;">🏢</div>
					<div class="oz-kpi-info">
						<div class="oz-kpi-val" id="oz-kpi-res-companies" style="color:#0891b2;">--</div>
						<div class="oz-kpi-lbl">Companies</div>
					</div>
				</div>
			</div>

			<!-- Reserved by Company -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.1s">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#fef3c7;color:#d97706;">🏢</div>
					<div><div class="oz-chart-title">Reserved by Company</div><div class="oz-chart-sub">Stock reserved per company</div></div>
				</div>
				<div id="oz-res-by-company"></div>
			</div>

			<!-- Reservations Table -->
			<div class="oz-chart-card oz-anim" style="animation-delay:0.12s">
				<div class="oz-chart-head">
					<div class="oz-chart-icon" style="background:#fef3c7;color:#d97706;">🛡</div>
					<div style="flex:1;"><div class="oz-chart-title">Active Reservations</div><div class="oz-chart-sub">Swastik reserved stock</div></div>
					<a class="oz-link" onclick="frappe.set_route('List','Stock Reservation',{status:'Reserved'})">View All →</a>
				</div>
				<div id="oz-table-res"></div>
			</div>
		</div>

	</div>`;
}

/* ═══════════ MULTI-SELECT COMPONENT ═══════════ */

function oz_init_multi(containerId, options, onChange, defaultSelected) {
	var container = document.getElementById(containerId);
	if (!container) return;
	container._selected = defaultSelected || options.map(function (o) { return o.value; });
	container._options = options;
	container._onChange = onChange;

	var btn = document.createElement('div');
	btn.className = 'oz-ms-btn';
	btn.textContent = 'All';
	container.appendChild(btn);

	var panel = document.createElement('div');
	panel.className = 'oz-ms-panel';
	panel._container = container;
	document.body.appendChild(panel);
	container._panel = panel;

	document.addEventListener('click', function (e) {
		if (!container.contains(e.target) && !panel.contains(e.target)) {
			panel.classList.remove('oz-ms-show');
			btn.classList.remove('oz-ms-open');
		}
	});

	btn.addEventListener('click', function (e) {
		e.stopPropagation();
		var isOpen = panel.classList.contains('oz-ms-show');
		document.querySelectorAll('.oz-ms-panel').forEach(function (p) { p.classList.remove('oz-ms-show'); });
		document.querySelectorAll('.oz-ms-btn').forEach(function (b) { b.classList.remove('oz-ms-open'); });
		if (!isOpen) {
			panel.classList.add('oz-ms-show');
			btn.classList.add('oz-ms-open');
			var rect = btn.getBoundingClientRect();
			panel.style.left = rect.left + 'px';
			panel.style.top = (rect.bottom + 4) + 'px';
			oz_render_ms_panel(container);
		}
	});

	oz_render_ms_panel(container);
	oz_update_ms_btn(container);
}

function oz_render_ms_panel(container) {
	var panel = container._panel || document.querySelector('.oz-ms-panel');
	var options = container._options || [];
	var selected = container._selected;

	var html = '<input class="oz-ms-search" type="text" placeholder="Search...">';
	html += '<div class="oz-ms-actions">';
	html += '<button class="oz-ms-action" data-action="all">Select All</button>';
	html += '<button class="oz-ms-action" data-action="clear">Clear</button>';
	html += '</div>';
	html += '<div class="oz-ms-error" style="display:none;text-align:center;padding:8px;color:#dc2626;font-size:10px;font-weight:600;">Select at least one element</div>';

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
			e.stopPropagation();
			var action = this.getAttribute('data-action');
			if (action === 'all') {
				container._selected = container._options.map(function (o) { return o.value; });
			} else {
				if (container._selected.length <= 1) {
					var errEl = panel.querySelector('.oz-ms-error');
					if (errEl) { errEl.style.display = 'block'; setTimeout(function () { errEl.style.display = 'none'; }, 2000); }
					return;
				}
				container._selected = [container._selected[0]];
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
				if (container._selected.length <= 1) {
					this.checked = true;
					var lbl = this.closest('.oz-ms-opt');
					if (lbl) {
						lbl.style.background = '#fee2e2';
						setTimeout(function () { lbl.style.background = ''; }, 1200);
					}
					return;
				}
				container._selected = container._selected.filter(function (v) { return v !== val; });
			}
			oz_update_ms_btn(container);
			oz_render_ms_panel(container);
			if (container._onChange) container._onChange(container._selected);
		});
	});
}

function oz_update_ms_btn(container) {
	var btn = container.querySelector('.oz-ms-btn');
	var sel = container._selected;
	var opts = container._options || [];
	if (sel.length === 0 || sel.length === opts.length) {
		btn.innerHTML = 'All';
	} else if (sel.length === 1) {
		var opt = opts.find(function (o) { return o.value === sel[0]; });
		var label = opt ? (opt.abbr || opt.label || sel[0]) : sel[0];
		btn.innerHTML = label + ' <span class="oz-ms-count">' + sel.length + '</span>';
	} else {
		btn.innerHTML = 'Selected ' + sel.length + ' <span class="oz-ms-count">' + sel.length + '</span>';
	}
}

function oz_update_options(containerId, options) {
	var container = document.getElementById(containerId);
	if (!container) return;
	container._options = options;
	container._selected = options.map(function (o) { return o.value; });
	oz_update_ms_btn(container);
	oz_render_ms_panel(container);
	if (container._onChange) container._onChange(container._selected);
}

/* ═══════════ SINGLE-SELECT COMPARE DROPDOWN ═══════════ */

function oz_init_compare(containerId, options, onChange, defaultVal) {
	var container = document.getElementById(containerId);
	if (!container) return;
	container._options = options || [];
	container._value = defaultVal || '';
	container._onChange = onChange;

	var btn = document.createElement('div');
	btn.className = 'oz-cs-btn';
	container.appendChild(btn);

	var panel = document.createElement('div');
	panel.className = 'oz-cs-panel';
	panel._container = container;
	document.body.appendChild(panel);
	container._panel = panel;

	document.addEventListener('click', function (e) {
		if (!container.contains(e.target) && !panel.contains(e.target)) {
			panel.classList.remove('oz-cs-show');
			btn.classList.remove('oz-cs-open');
		}
	});

	btn.addEventListener('click', function (e) {
		e.stopPropagation();
		var isOpen = panel.classList.contains('oz-cs-show');
		document.querySelectorAll('.oz-cs-panel').forEach(function (p) { p.classList.remove('oz-cs-show'); });
		document.querySelectorAll('.oz-cs-btn').forEach(function (b) { b.classList.remove('oz-cs-open'); });
		if (!isOpen) {
			panel.classList.add('oz-cs-show');
			btn.classList.add('oz-cs-open');
			var rect = btn.getBoundingClientRect();
			panel.style.left = rect.left + 'px';
			panel.style.top = (rect.bottom + 4) + 'px';
		}
	});

	oz_render_cs_panel(container);
}

function oz_render_cs_panel(container) {
	var panel = container._panel || document.querySelector('.oz-cs-panel');
	var btn = container.querySelector('.oz-cs-btn');
	var options = container._options || [];
	var value = container._value;

	var selectedOpt = options.find(function (o) { return o.value === value; });
	btn.textContent = selectedOpt ? selectedOpt.label : 'None';

	var html = '<div class="oz-cs-opt' + (value === '' ? ' oz-cs-selected' : '') + '" data-value="">None</div>';
	options.forEach(function (opt) {
		var cls = opt.value === value ? ' oz-cs-selected' : '';
		html += '<div class="oz-cs-opt' + cls + '" data-value="' + opt.value + '">' + opt.label + '</div>';
	});
	panel.innerHTML = html;

	panel.querySelectorAll('.oz-cs-opt').forEach(function (el) {
		el.addEventListener('click', function () {
			container._value = this.getAttribute('data-value');
			oz_render_cs_panel(container);
			panel.classList.remove('oz-cs-show');
			btn.classList.remove('oz-cs-open');
			if (container._onChange) container._onChange(container._value);
		});
	});
}

function oz_set_compare(containerId, value) {
	var container = document.getElementById(containerId);
	if (!container) return;
	container._value = value || '';
	oz_render_cs_panel(container);
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

function oz_sparkline_with_pct(el, values, color, prevVal) {
	if (!values || values.length < 2) { el.innerHTML = ''; return; }
	var w = 60, h = 18, p = 2;
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
	// Add percentage change next to sparkline
	if (prevVal !== null && prevVal !== undefined && prevVal !== 0) {
		var currVal = values[values.length - 1];
		var change = ((currVal - prevVal) / Math.abs(prevVal)) * 100;
		change = Math.max(-999, Math.min(999, change));
		var changeRound = Math.round(change * 10) / 10;
		var pctColor = changeRound >= 0 ? '#059669' : '#dc2626';
		var arrow = changeRound >= 0 ? '↑' : '↓';
		s += '<span style="font-size:9px;font-weight:700;color:' + pctColor + ';margin-left:4px;white-space:nowrap;">' + (changeRound >= 0 ? '+' : '') + changeRound + '%' + arrow + '</span>';
	}
	el.innerHTML = s;
}

/* ═══════════ STACKED BAR CHART WITH VARIANCE ═══════════ */

function oz_build_stacked_bar(container, tooltip, labels, sales, purchase, variance, variance_change) {
	if (!labels || !labels.length) { container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">No data</div>'; return; }

	// Use container width for full-width chart
	var containerW = container.offsetWidth || 700;
	var W = Math.max(containerW, 400);
	var H = 260, P = { t: 20, r: 20, b: 50, l: 55 };
	var cw = W - P.l - P.r, ch = H - P.t - P.b;
	var n = labels.length;
	var groupW = cw / n;
	var barW = Math.min(groupW * 0.5, Math.max(20, Math.min(40, cw / n * 0.4)));

	// Calculate stacked totals for Y-axis scaling
	var totals = [];
	for (var i = 0; i < n; i++) {
		totals.push((sales[i] || 0) + (purchase[i] || 0));
	}
	var mx = Math.max.apply(null, totals) * 1.15 || 1;

	// Variance range
	var varMin = 0, varMax = 0;
	if (variance && variance.length) {
		varMin = Math.min.apply(null, variance);
		varMax = Math.max.apply(null, variance);
		var range = Math.max(Math.abs(varMin), Math.abs(varMax)) * 1.2 || 1;
		varMin = -range;
		varMax = range;
	}

	function yScale(v) { return P.t + ch - (v / mx) * ch; }
	function varScale(v) { return P.t + ch - ((v - varMin) / (varMax - varMin || 1)) * ch; }

	var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:' + H + 'px;">';

	// Defs
	s += '<defs>';
	s += '<filter id="barShadow"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.1"/></filter>';
	s += '<linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#2563eb"/></linearGradient>';
	s += '<linearGradient id="procGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#10b981"/><stop offset="100%" stop-color="#059669"/></linearGradient>';
	s += '</defs>';

	// Grid lines
	for (var g = 0; g <= 5; g++) {
		var gy = P.t + (g / 5) * ch;
		var val = Math.round(mx * (1 - g / 5));
		s += '<line x1="' + P.l + '" y1="' + gy + '" x2="' + (W - P.r) + '" y2="' + gy + '" stroke="#e2e8f0" stroke-width="0.5"/>';
		s += '<text x="' + (P.l - 8) + '" y="' + (gy + 3) + '" text-anchor="end" fill="#94a3b8" font-size="8" font-weight="600">' + oz_k(val) + '</text>';
	}

	// Stacked bars
	labels.forEach(function (l, i) {
		var cx = P.l + i * groupW + groupW / 2;
		var sv = sales[i] || 0, pv = purchase[i] || 0;
		var sh = Math.max(1, (sv / mx) * ch);
		var ph = Math.max(1, (pv / mx) * ch);
		var totalH = sh + ph;

		// Sales (bottom)
		var salesY = P.t + ch - sh;
		s += '<g class="oz-bar-group" data-idx="' + i + '" data-type="sales">';
		s += '<rect x="' + (cx - barW / 2) + '" y="' + salesY + '" width="' + barW + '" height="' + sh + '" rx="0" fill="url(#salesGrad)" opacity="0.9" filter="url(#barShadow)" style="transition:opacity 0.15s;cursor:pointer;"/>';
		s += '<rect x="' + (cx - barW / 2) + '" y="' + (P.t) + '" width="' + barW + '" height="' + ch + '" fill="transparent" style="cursor:pointer;"/>';
		s += '</g>';

		// Procurement (top, stacked on sales)
		var procY = salesY - ph;
		s += '<g class="oz-bar-group" data-idx="' + i + '" data-type="purchase">';
		s += '<rect x="' + (cx - barW / 2) + '" y="' + procY + '" width="' + barW + '" height="' + ph + '" rx="3" fill="url(#procGrad)" opacity="0.9" filter="url(#barShadow)" style="transition:opacity 0.15s;cursor:pointer;"/>';
		s += '<rect x="' + (cx - barW / 2) + '" y="' + (P.t) + '" width="' + barW + '" height="' + ch + '" fill="transparent" style="cursor:pointer;"/>';
		s += '</g>';

		// Month label
		s += '<text x="' + cx + '" y="' + (H - 28) + '" text-anchor="middle" fill="#64748b" font-size="9" font-weight="700">' + l + '</text>';

		// Variance indicator (line + dot)
		if (variance && variance[i] !== undefined) {
			var vY = varScale(variance[i]);
			var vColor = variance[i] >= 0 ? '#059669' : '#dc2626';
			var vPct = sv > 0 ? ((variance[i] / sv) * 100).toFixed(1) : '0.0';
			// Horizontal dashed line at zero
			if (i === 0) {
				var zeroY = varScale(0);
				s += '<line x1="' + P.l + '" y1="' + zeroY + '" x2="' + (W - P.r) + '" y2="' + zeroY + '" stroke="#94a3b8" stroke-width="0.5" stroke-dasharray="4,4"/>';
			}
			s += '<circle cx="' + cx + '" cy="' + vY + '" r="4" fill="' + vColor + '" opacity="0.9" filter="url(#barShadow)">';
			s += '<title>Variance: ' + (variance[i] >= 0 ? '+' : '') + oz_k(variance[i]) + ' (' + vPct + '%)</title></circle>';
			// Connect to previous point with line
			if (i > 0 && variance[i - 1] !== undefined) {
				var prevX = P.l + (i - 1) * groupW + groupW / 2;
				var prevY = varScale(variance[i - 1]);
				s += '<line x1="' + prevX + '" y1="' + prevY + '" x2="' + cx + '" y2="' + vY + '" stroke="' + vColor + '" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.5"/>';
			}
			// MoM Change label (N/A for first, then show change %)
			if (variance_change && variance_change[i] !== null && variance_change[i] !== undefined) {
				var change = variance_change[i];
				var changeColor = change >= 0 ? '#059669' : '#dc2626';
				var changeArrow = change >= 0 ? '↑' : '↓';
				s += '<text x="' + cx + '" y="' + (H - 14) + '" text-anchor="middle" fill="' + changeColor + '" font-size="8" font-weight="700">' + (change >= 0 ? '+' : '') + change + '%' + changeArrow + '</text>';
			} else {
				s += '<text x="' + cx + '" y="' + (H - 14) + '" text-anchor="middle" fill="#94a3b8" font-size="8" font-weight="600">N/A</text>';
			}
		}

		// Total on top of stack
		s += '<text x="' + cx + '" y="' + (procY - 5) + '" text-anchor="middle" fill="#1e293b" font-size="7" font-weight="700">' + oz_k(sv + pv) + '</text>';
	});

	s += '</svg>';

	// Legend
	s += '<div style="display:flex;gap:16px;justify-content:center;margin-top:8px;">';
	s += '<div style="display:flex;align-items:center;gap:5px;"><div style="width:10px;height:10px;border-radius:3px;background:#3b82f6;"></div><span style="font-size:10px;font-weight:600;color:#64748b;">Sales</span></div>';
	s += '<div style="display:flex;align-items:center;gap:5px;"><div style="width:10px;height:10px;border-radius:3px;background:#10b981;"></div><span style="font-size:10px;font-weight:600;color:#64748b;">Procurement</span></div>';
	s += '<div style="display:flex;align-items:center;gap:5px;"><div style="width:10px;height:10px;border-radius:50%;background:#059669;"></div><span style="font-size:10px;font-weight:600;color:#64748b;">Variance</span></div>';
	s += '</div>';

	container.innerHTML = s;

	// Tooltip logic - shows Sales, Procurement, Variance, and MoM Change in one tooltip
	var tip = tooltip;
	container.querySelectorAll('.oz-bar-group').forEach(function (g) {
		g.addEventListener('mouseenter', function (e) {
			var idx = parseInt(g.getAttribute('data-idx'));
			var sv = sales[idx] || 0;
			var pv = purchase[idx] || 0;
			var v = variance && variance[idx] !== undefined ? variance[idx] : sv - pv;
			var vPct = sv > 0 ? ((v / sv) * 100).toFixed(1) : '0.0';
			var vColor = v >= 0 ? '#059669' : '#dc2626';
			tip.innerHTML = '<div style="font-size:10px;font-weight:700;color:#1e293b;margin-bottom:4px;">' + labels[idx] + '</div>' +
				'<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;"><div style="width:6px;height:6px;border-radius:2px;background:#3b82f6;"></div><span style="font-size:9px;color:#64748b;">Sales</span><span style="font-size:10px;font-weight:700;color:#3b82f6;margin-left:auto;">' + oz_k(sv) + '</span></div>' +
				'<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;"><div style="width:6px;height:6px;border-radius:2px;background:#10b981;"></div><span style="font-size:9px;color:#64748b;">Procurement</span><span style="font-size:10px;font-weight:700;color:#10b981;margin-left:auto;">' + oz_k(pv) + '</span></div>' +
				'<div style="border-top:1px solid #e2e8f0;margin-top:3px;padding-top:3px;display:flex;align-items:center;gap:5px;"><div style="width:6px;height:6px;border-radius:50%;background:' + vColor + ';"></div><span style="font-size:9px;color:#64748b;">Variance</span><span style="font-size:10px;font-weight:700;color:' + vColor + ';margin-left:auto;">' + (v >= 0 ? '+' : '') + oz_k(v) + ' (' + vPct + '%)</span></div>';
			// MoM Change
			if (variance_change && variance_change[idx] !== null && variance_change[idx] !== undefined) {
				var change = variance_change[idx];
				var changeColor = change >= 0 ? '#059669' : '#dc2626';
				var changeArrow = change >= 0 ? '↑' : '↓';
				tip.innerHTML += '<div style="display:flex;align-items:center;gap:5px;margin-top:3px;"><span style="font-size:9px;color:#94a3b8;">vs Previous</span><span style="font-size:10px;font-weight:700;color:' + changeColor + ';margin-left:auto;">' + (change >= 0 ? '+' : '') + change + '% ' + changeArrow + '</span></div>';
			} else {
				tip.innerHTML += '<div style="display:flex;align-items:center;gap:5px;margin-top:3px;"><span style="font-size:9px;color:#94a3b8;">vs Previous</span><span style="font-size:10px;font-weight:700;color:#94a3b8;margin-left:auto;">N/A</span></div>';
			}
			var rect = g.getBoundingClientRect();
			tip.style.left = (rect.left + rect.width / 2) + 'px';
			tip.style.top = (rect.top - 12) + 'px';
			tip.style.transform = 'translateX(-50%) translateY(-100%)';
			tip.classList.add('show');
		});
		g.addEventListener('mouseleave', function () {
			tip.classList.remove('show');
		});
	});
}

/* ═══════════ SVG CHARTS ═══════════ */

function oz_donut(el, data, size) {
	size = size || 160;
	var total = data.reduce(function (s, d) { return s + d.value; }, 0);
	if (total === 0) { el.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;">No data</div>'; return; }

	var r = (size - 20) / 2, circ = 2 * Math.PI * r, ct = size / 2;
	var cum = 0;
	var uid = 'donut-' + Math.random().toString(36).substr(2, 6);

	// Build segments with gaps
	var segs = data.map(function (item) {
		var pct = item.value / total;
		var seg = { label: item.label, value: item.value, color: item.color, pct: pct, cum: cum };
		cum += pct;
		return seg;
	});

	var s = '<div style="display:flex;align-items:center;gap:20px;justify-content:center;">';

	// SVG donut
	s += '<div style="position:relative;width:' + size + 'px;height:' + size + 'px;">';
	s += '<svg width="' + size + '" height="' + size + '" style="transform:rotate(-90deg);" id="' + uid + '-svg">';

	// Background circle
	s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="#f1f5f9" stroke-width="20"/>';

	// Segments with gap
	var gapPct = 0.015; // gap between segments
	segs.forEach(function (seg, i) {
		var adj = Math.max(0, seg.pct - gapPct);
		var dash = circ * adj;
		var gap = circ * (seg.pct - adj);
		var offset = -circ * seg.cum;
		s += '<circle class="oz-donut-seg" data-idx="' + i + '" cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="' + seg.color + '" stroke-width="20" stroke-dasharray="' + dash + ' ' + (circ - dash) + '" stroke-dashoffset="' + offset + '" stroke-linecap="round" style="transition:stroke-width 0.2s, opacity 0.2s;cursor:pointer;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.08));">';
		s += '<title>' + seg.label + ': ' + oz_n(seg.value) + ' (' + Math.round(seg.pct * 100) + '%)</title></circle>';
	});

	s += '</svg>';

	// Center text
	s += '<div id="' + uid + '-center" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">';
	s += '<span style="font-size:22px;font-weight:800;color:#1e293b;">' + total.toLocaleString() + '</span>';
	s += '<span style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">Total</span>';
	s += '</div></div>';

	// Interactive legend
	s += '<div id="' + uid + '-legend" style="display:flex;flex-direction:column;gap:6px;">';
	segs.forEach(function (seg, i) {
		var pctStr = Math.round(seg.pct * 100) + '%';
		s += '<div class="oz-donut-leg" data-idx="' + i + '" style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:6px;cursor:pointer;transition:all 0.15s;border:1px solid transparent;">';
		s += '<div style="width:10px;height:10px;border-radius:3px;background:' + seg.color + ';flex-shrink:0;transition:transform 0.2s;"></div>';
		s += '<div style="flex:1;min-width:0;">';
		s += '<div style="font-size:10px;font-weight:700;color:#1e293b;">' + seg.label + '</div>';
		s += '<div style="font-size:9px;color:#94a3b8;">' + oz_n(seg.value) + ' (' + pctStr + ')</div>';
		s += '</div>';
		s += '<div style="width:40px;height:4px;border-radius:4px;background:#f1f5f9;overflow:hidden;">';
		s += '<div style="height:100%;width:' + (seg.pct * 100) + '%;background:' + seg.color + ';border-radius:4px;"></div>';
		s += '</div></div>';
	});
	s += '</div></div>';

	el.innerHTML = s;

	// Interactivity
	var svg = document.getElementById(uid + '-svg');
	var legend = document.getElementById(uid + '-legend');
	var center = document.getElementById(uid + '-center');
	var segs_el = svg.querySelectorAll('.oz-donut-seg');
	var leg_items = legend.querySelectorAll('.oz-donut-leg');

	function highlight(idx) {
		segs_el.forEach(function (c, i) {
			if (idx === null) {
				c.style.strokeWidth = '20';
				c.style.opacity = '1';
			} else if (i === idx) {
				c.style.strokeWidth = '26';
				c.style.opacity = '1';
			} else {
				c.style.strokeWidth = '16';
				c.style.opacity = '0.35';
			}
		});
		leg_items.forEach(function (l, i) {
			if (idx === null) {
				l.style.borderColor = 'transparent';
				l.style.background = 'transparent';
			} else if (i === idx) {
				l.style.borderColor = segs[i].color;
				l.style.background = segs[i].color + '08';
			} else {
				l.style.borderColor = 'transparent';
				l.style.background = 'transparent';
			}
		});
		if (idx !== null) {
			center.innerHTML = '<span style="font-size:20px;font-weight:800;color:' + segs[idx].color + ';">' + Math.round(segs[idx].pct * 100) + '%</span><span style="font-size:8px;font-weight:700;color:#94a3b8;">' + segs[idx].label + '</span>';
		} else {
			center.innerHTML = '<span style="font-size:22px;font-weight:800;color:#1e293b;">' + total.toLocaleString() + '</span><span style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">Total</span>';
		}
	}

	segs_el.forEach(function (c) {
		c.addEventListener('mouseenter', function () { highlight(parseInt(this.getAttribute('data-idx'))); });
		c.addEventListener('mouseleave', function () { highlight(null); });
	});

	leg_items.forEach(function (l) {
		l.addEventListener('mouseenter', function () { highlight(parseInt(this.getAttribute('data-idx'))); });
		l.addEventListener('mouseleave', function () { highlight(null); });
		l.addEventListener('click', function () {
			var idx = parseInt(this.getAttribute('data-idx'));
			frappe.set_route('List', 'Bin', { company: data[idx].label });
		});
	});
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

/* ═══════════ FILTER TAG ═══════════ */

function oz_update_filter_tag() {
	var co = window.oz_company || 'All';
	var fy = window.oz_fy || 'All';

	// Company badge
	var coTag = document.getElementById('oz-filter-company');
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

	// FY badge
	var fyTag = document.getElementById('oz-filter-fy');
	if (fyTag) {
		if (fy === 'All') {
			fyTag.textContent = 'All FY';
			fyTag.style.background = '#eff6ff';
			fyTag.style.color = '#3b82f6';
		} else {
			var fyLabel = fy.split(',').map(function (f) {
				var parts = f.split('_');
				if (parts.length === 2) {
					var sy = parts[0].split('-')[0];
					var ey = parts[1].split('-')[0];
					return 'FY ' + sy + '-' + String(ey).slice(-2);
				}
				return f;
			}).join(', ');
			fyTag.textContent = fyLabel;
			fyTag.style.background = '#fef3c7';
			fyTag.style.color = '#d97706';
		}
	}
}

/* ═══════════ DATA LOADING ═══════════ */

function load_all_data() {
	var co = window.oz_company;
	var item = window.oz_item;
	var period = window.oz_period;

	oz_update_filter_tag();

	// Update period labels
	$('#oz-period-sales,#oz-period-proc,#oz-period-pl').text(period);

			$('#oz-kpi-sales,#oz-kpi-proc,#oz-kpi-avail,#oz-kpi-reserved,#oz-kpi-neg,#oz-kpi-pl,#oz-kpi-ict2,#oz-kpi-ict-count,#oz-kpi-ict-val,#oz-kpi-reserved2,#oz-kpi-resqty,#oz-kpi-res-val,#oz-kpi-res-items,#oz-kpi-res-util,#oz-kpi-res-companies').text('--');
			$('#oz-kpi-sales-change,#oz-kpi-proc-change,#oz-kpi-pl-change').text('').css('color', '');
			window.oz_kpi_data = {};
			$('#oz-bar-chart,#oz-monthly-table,#oz-chart-donut,#oz-funnel-content,#oz-ring,#oz-mini-stats,#oz-table-res,#oz-table-ict,#oz-table-neg,#oz-activity,#oz-top-items,#oz-top-customers,#oz-company-compare,#oz-ict-chain,#oz-warehouse-table,#oz-routes-breakdown,#oz-routes-breakdown,#oz-res-by-company').html('<div style="text-align:center;padding:20px;color:#94a3b8;font-size:10px;">Loading...</div>');
			$('#oz-spark-sales,#oz-spark-proc,#oz-spark-pl').html('');
			$('#oz-sales-breakdown,#oz-proc-breakdown,#oz-pl-breakdown').html('');

	var args = { company: co, item: item, fy: window.oz_fy || 'All', period: period };
	if (period === 'MTD') args.selected_months = (window.oz_selected_months || []).join(',');
	if (period === 'QTD') args.selected_qtrs = (window.oz_selected_qtrs || []).join(',');
	if (period === 'YTD') args.selected_ytd_fys = (window.oz_selected_ytd_fys || []).join(',');
	// Pass compare selection
	if (period === 'MTD' && window.oz_compare_month !== undefined && window.oz_compare_month !== '') {
		args.compare_month = window.oz_compare_month;
	} else if (period === 'QTD' && window.oz_compare_qtr !== undefined && window.oz_compare_qtr !== '') {
		args.compare_qtr = window.oz_compare_qtr;
	} else if (period === 'YTD' && window.oz_compare_fy !== undefined && window.oz_compare_fy !== '') {
		args.compare_fy = window.oz_compare_fy;
	}

	/* ── KPIs ── */
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_kpis',
		args: args,
		callback: function (r) {
			if (!r.message) return;
			var d = r.message;
			window.oz_kpi_data = d;  // Store for sparkline with %

			oz_count(document.getElementById('oz-kpi-sales'), Math.round(d.sales_mtd), '₹', '');
			setTimeout(function () { document.getElementById('oz-kpi-sales').textContent = oz_k(d.sales_mtd); }, 1300);
			oz_count(document.getElementById('oz-kpi-proc'), Math.round(d.procurement_mtd), '₹', '');
			setTimeout(function () { document.getElementById('oz-kpi-proc').textContent = oz_k(d.procurement_mtd); }, 1300);

			var plColor = d.profit_loss >= 0 ? '#059669' : '#dc2626';
			var plBg = d.profit_loss >= 0 ? '#d1fae5' : '#fee2e2';
			document.getElementById('oz-kpi-pl').style.color = plColor;
			document.getElementById('oz-kpi-pl-icon').style.background = plBg;
			document.getElementById('oz-kpi-pl-icon').style.color = plColor;
			oz_count(document.getElementById('oz-kpi-pl'), Math.round(d.profit_loss), '₹', '');
			setTimeout(function () { document.getElementById('oz-kpi-pl').textContent = oz_k(d.profit_loss); }, 1300);

			// Period change indicators (MoM/QoQ/YoY) on all 3 cards
			function setChange(elemId, currVal, prevVal) {
				var el = document.getElementById(elemId);
				if (!el) return;
				if (!d.show_change || prevVal === null || prevVal === undefined || prevVal === 0) {
					el.textContent = d.show_change ? 'N/A' : '';
					el.style.color = '#94a3b8';
					return;
				}
				var change = ((currVal - prevVal) / Math.abs(prevVal)) * 100;
				change = Math.max(-999, Math.min(999, change));
				var changeRound = Math.round(change * 10) / 10;
				var color = changeRound >= 0 ? '#059669' : '#dc2626';
				var arrow = changeRound >= 0 ? '↑' : '↓';
				el.textContent = (changeRound >= 0 ? '+' : '') + changeRound + '% ' + arrow;
				el.style.color = color;
			}
			setChange('oz-kpi-sales-change', d.sales_mtd, d.sales_prev);
			setChange('oz-kpi-proc-change', d.procurement_mtd, d.procurement_prev);
			setChange('oz-kpi-pl-change', d.profit_loss, d.profit_loss_prev);

			oz_count(document.getElementById('oz-kpi-avail'), Math.round(d.available_stock), '', ' L');
			setTimeout(function () { document.getElementById('oz-kpi-avail').textContent = oz_n(d.available_stock) + ' L'; }, 1300);
			oz_count(document.getElementById('oz-kpi-reserved'), Math.round(d.reserved_stock), '', ' L');
			setTimeout(function () { document.getElementById('oz-kpi-reserved').textContent = oz_n(d.reserved_stock) + ' L'; }, 1300);
			oz_count(document.getElementById('oz-kpi-neg'), d.negative_alerts, '', '');
			setTimeout(function () { document.getElementById('oz-kpi-neg').textContent = d.negative_alerts + ' Alerts'; }, 1300);
			oz_count(document.getElementById('oz-kpi-ict2'), Math.round(d.intercompany_volume), '', ' L');
			setTimeout(function () { document.getElementById('oz-kpi-ict2').textContent = oz_n(d.intercompany_volume) + ' L'; }, 1300);

			// Company breakdown helper with per-company change %
			function render_breakdown(containerId, data, color, total, prevData) {
				var el = document.getElementById(containerId);
				if (!el || !data) return;
				var colors = { 'GE': '#3b82f6', 'GEX': '#10b981', 'SHE': '#f59e0b' };
				var html = '';
				data.forEach(function (row) {
					var c = colors[row.abbr] || '#64748b';
					var pct = total > 0 ? ((row.total / total) * 100).toFixed(0) : 0;
					// Calculate per-company change % (only when 1 period selected)
					var changeHtml = '';
					if (d.show_change && prevData && prevData.length) {
						var prevRow = prevData.find(function(x){ return x.abbr === row.abbr; });
						var prevVal = prevRow ? prevRow.total : 0;
						if (prevVal && prevVal !== 0) {
							var change = ((row.total - prevVal) / Math.abs(prevVal)) * 100;
							change = Math.max(-999, Math.min(999, change));
							var changeRound = Math.round(change * 10) / 10;
							var changeColor = changeRound >= 0 ? '#059669' : '#dc2626';
							var arrow = changeRound >= 0 ? '↑' : '↓';
							changeHtml = '<div style="font-size:9px;font-weight:700;color:' + changeColor + ';margin-top:1px;">' + (changeRound >= 0 ? '+' : '') + changeRound + '% ' + arrow + '</div>';
						} else {
							changeHtml = '<div style="font-size:9px;font-weight:600;color:#94a3b8;margin-top:1px;">N/A</div>';
						}
					}
					html += '<div style="background:' + c + '08;border:1px solid ' + c + '20;border-radius:8px;padding:8px;text-align:center;position:relative;cursor:pointer;">';
					html += '<div style="font-size:10px;font-weight:800;color:' + c + ';">' + row.abbr + '</div>';
					html += '<div style="font-size:12px;font-weight:800;color:#1e293b;margin-top:2px;">' + oz_k(row.total) + '</div>';
					html += changeHtml;
					html += '<div style="height:3px;border-radius:3px;background:#f1f5f9;margin-top:4px;overflow:hidden;">';
					html += '<div style="height:100%;width:' + pct + '%;background:' + c + ';border-radius:3px;"></div>';
					html += '</div>';
					html += '</div>';
				});
				el.innerHTML = html;
			}

			// Render company breakdowns with per-company change %
			render_breakdown('oz-sales-breakdown', d.sales_by_company, '#3b82f6', d.sales_mtd, d.sales_prev_by_company);
			render_breakdown('oz-proc-breakdown', d.procurement_by_company, '#10b981', d.procurement_mtd, d.procurement_prev_by_company);
			render_breakdown('oz-pl-breakdown', d.profit_loss_by_company, '#d97706', Math.abs(d.profit_loss), d.profit_loss_prev_by_company);

			// Funnel - compact horizontal
			var tot = d.available_stock + d.reserved_stock;
			var fh = '<div style="display:flex;flex-direction:column;gap:6px;">';
			[
				{ l: 'Total', v: tot, c: '#3b82f6', p: 100 },
				{ l: 'Available', v: d.available_stock, c: '#10b981', p: tot > 0 ? (d.available_stock / tot) * 100 : 0 },
				{ l: 'Reserved', v: d.reserved_stock, c: '#f59e0b', p: tot > 0 ? (d.reserved_stock / tot) * 100 : 0 },
				{ l: 'Negative', v: d.negative_alerts, c: '#ef4444', p: tot > 0 ? (d.negative_alerts / tot) * 100 : 0 }
			].forEach(function (s) {
				fh += '<div style="display:flex;align-items:center;gap:8px;">';
				fh += '<span style="font-size:9px;font-weight:700;color:#64748b;width:52px;flex-shrink:0;">' + s.l + '</span>';
				fh += '<div style="flex:1;height:5px;border-radius:5px;background:#f1f5f9;overflow:hidden;">';
				fh += '<div style="height:100%;width:' + s.p + '%;border-radius:5px;background:' + s.c + ';transition:width 0.8s cubic-bezier(0.22,1,0.36,1);"></div></div>';
				fh += '<span style="font-size:10px;font-weight:800;color:' + s.c + ';min-width:40px;text-align:right;">' + s.v.toLocaleString() + '</span>';
				fh += '<span style="font-size:8px;font-weight:700;color:' + s.c + ';min-width:28px;text-align:right;">' + Math.round(s.p) + '%</span>';
				fh += '</div>';
			});
			fh += '</div>';
			// ICT extended KPIs
			if (d.ict_count_mtd !== undefined) {
				var ictCountEl = document.getElementById('oz-kpi-ict-count');
				if (ictCountEl) { oz_count(ictCountEl, d.ict_count_mtd, '', ''); setTimeout(function () { ictCountEl.textContent = d.ict_count_mtd; }, 1300); }
				var ictValEl = document.getElementById('oz-kpi-ict-val');
				if (ictValEl) { oz_count(ictValEl, Math.round(d.ict_value_mtd), '₹', ''); setTimeout(function () { ictValEl.textContent = oz_k(d.ict_value_mtd); }, 1300); }
			}
			// Reservation extended KPIs
			if (d.reserved_value !== undefined) {
				var resValEl = document.getElementById('oz-kpi-res-val');
				if (resValEl) { oz_count(resValEl, Math.round(d.reserved_value), '₹', ''); setTimeout(function () { resValEl.textContent = oz_k(d.reserved_value); }, 1300); }
				var resItemsEl = document.getElementById('oz-kpi-res-items');
				if (resItemsEl) { oz_count(resItemsEl, d.reserved_items, '', ''); setTimeout(function () { resItemsEl.textContent = d.reserved_items; }, 1300); }
				var resUtilEl = document.getElementById('oz-kpi-res-util');
				if (resUtilEl) { oz_count(resUtilEl, d.utilization_pct, '', '%'); setTimeout(function () { resUtilEl.textContent = d.utilization_pct + '%'; }, 1300); }
				var resCompEl = document.getElementById('oz-kpi-res-companies');
				if (resCompEl && d.reserved_by_company) { oz_count(resCompEl, d.reserved_by_company.length, '', ''); setTimeout(function () { resCompEl.textContent = d.reserved_by_company.length; }, 1300); }
			}
			// Reserved by company
			if (d.reserved_by_company) { oz_render_reserved_by_company(d.reserved_by_company); }
			// Routes breakdown
			if (d.routes_breakdown) { oz_render_routes_breakdown(d.routes_breakdown); }
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
		args: args,
		callback: function (r) {
			if (!r.message) return;
			var d = r.message;

			oz_build_stacked_bar(document.getElementById('oz-bar-chart'), document.getElementById('oz-bar-tooltip'), d.labels, d.sales, d.purchase, d.variance, d.variance_change);

			// Sparklines with percentage change (only when 1 period selected)
			var salesPrevVal = (d.show_change && window.oz_kpi_data) ? window.oz_kpi_data.sales_prev : null;
			var procPrevVal = (d.show_change && window.oz_kpi_data) ? window.oz_kpi_data.procurement_prev : null;
			var plPrevVal = (d.show_change && window.oz_kpi_data) ? window.oz_kpi_data.profit_loss_prev : null;
			oz_sparkline_with_pct(document.getElementById('oz-spark-sales'), d.sales, '#3b82f6', salesPrevVal);
			oz_sparkline_with_pct(document.getElementById('oz-spark-proc'), d.purchase, '#10b981', procPrevVal);
			var plValues = (d.sales || []).map(function (s, i) { return (s || 0) - (d.purchase[i] || 0); });
			oz_sparkline_with_pct(document.getElementById('oz-spark-pl'), plValues, '#d97706', plPrevVal);

			// Monthly table with variance and MoM change
			var th = '<table class="oz-table"><thead><tr><th>Month</th><th style="text-align:right;">Sales</th><th style="text-align:right;">Procurement</th><th style="text-align:right;">Variance</th><th style="text-align:right;">Margin %</th><th style="text-align:right;">vs Prev</th></tr></thead><tbody>';
			for (var i = 0; i < d.labels.length; i++) {
				var s = d.sales[i] || 0, p = d.purchase[i] || 0;
				var v = d.variance ? d.variance[i] : (s - p);
				var margin = s > 0 ? ((v / s) * 100).toFixed(1) : '0.0';
				var vc = v >= 0 ? '#059669' : '#dc2626';
				var change = d.variance_change ? d.variance_change[i] : null;
				var changeHtml = '';
				if (change !== null && change !== undefined) {
					var cc = change >= 0 ? '#059669' : '#dc2626';
					var ca = change >= 0 ? '↑' : '↓';
					changeHtml = '<span style="font-weight:700;color:' + cc + ';">' + (change >= 0 ? '+' : '') + change + '% ' + ca + '</span>';
				} else {
					changeHtml = '<span style="color:#94a3b8;font-weight:600;">N/A</span>';
				}
				th += '<tr onclick="frappe.set_route(\'List\',\'Sales Invoice\')">';
				th += '<td style="font-weight:700;color:#1e293b;">' + d.labels[i] + '</td>';
				th += '<td style="text-align:right;font-weight:700;color:#3b82f6;">' + oz_k(s) + '</td>';
				th += '<td style="text-align:right;font-weight:700;color:#10b981;">' + oz_k(p) + '</td>';
				th += '<td style="text-align:right;font-weight:700;color:' + vc + ';">' + (v >= 0 ? '+' : '') + oz_k(v) + '</td>';
				th += '<td style="text-align:right;font-weight:700;color:' + vc + ';">' + margin + '%</td>';
				th += '<td style="text-align:right;">' + changeHtml + '</td>';
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
			var totalRev = r.message.reduce(function (s, row) { return s + (row.total_revenue || 0); }, 0);
			var h = '<table class="oz-table"><thead><tr><th>#</th><th>Item</th><th>Qty</th><th style="text-align:right;">Revenue</th><th style="width:100px;">% of Total</th></tr></thead><tbody>';
			r.message.forEach(function (row, i) {
				var pct = totalRev > 0 ? ((row.total_revenue / totalRev) * 100).toFixed(1) : '0.0';
				var rankColor = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : '#e2e8f0';
				var rankText = i === 0 ? '#fff' : i === 1 ? '#fff' : i === 2 ? '#fff' : '#94a3b8';
				h += '<tr>';
				h += '<td><span class="oz-rank" style="background:' + rankColor + ';color:' + rankText + ';">' + (i + 1) + '</span></td>';
				h += '<td style="font-weight:700;color:#1e293b;">' + row.item_code + '</td>';
				h += '<td>' + oz_n(row.total_qty) + '</td>';
				h += '<td style="text-align:right;font-weight:700;color:#3b82f6;">' + oz_k(row.total_revenue) + '</td>';
				h += '<td><div style="display:flex;align-items:center;gap:6px;"><div class="oz-prog" style="flex:1;"><div class="oz-prog-fill" style="width:' + pct + '%;background:linear-gradient(90deg,#3b82f6,#60a5fa);"></div></div><span style="font-size:9px;font-weight:700;color:#64748b;min-width:32px;text-align:right;">' + pct + '%</span></div></td>';
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
			var totalAmt = r.message.reduce(function (s, row) { return s + (row.total_amount || 0); }, 0);
			var h = '<table class="oz-table"><thead><tr><th>#</th><th>Customer</th><th>Inv</th><th style="text-align:right;">Amount</th><th style="width:100px;">% of Total</th></tr></thead><tbody>';
			r.message.forEach(function (row, i) {
				var pct = totalAmt > 0 ? ((row.total_amount / totalAmt) * 100).toFixed(1) : '0.0';
				var rankColor = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : '#e2e8f0';
				var rankText = i === 0 ? '#fff' : i === 1 ? '#fff' : i === 2 ? '#fff' : '#94a3b8';
				h += '<tr>';
				h += '<td><span class="oz-rank" style="background:' + rankColor + ';color:' + rankText + ';">' + (i + 1) + '</span></td>';
				h += '<td style="font-weight:700;color:#1e293b;">' + (row.customer_name || row.customer) + '</td>';
				h += '<td>' + row.invoice_count + '</td>';
				h += '<td style="text-align:right;font-weight:700;color:#059669;">' + oz_k(row.total_amount) + '</td>';
				h += '<td><div style="display:flex;align-items:center;gap:6px;"><div class="oz-prog" style="flex:1;"><div class="oz-prog-fill" style="width:' + pct + '%;background:linear-gradient(90deg,#10b981,#34d399);"></div></div><span style="font-size:9px;font-weight:700;color:#64748b;min-width:32px;text-align:right;">' + pct + '%</span></div></td>';
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
			var data = r.message;
			function oz_ict_row(row) {
				var s = '<div style="border:1px solid #f1f5f9;border-radius:10px;padding:12px;margin-bottom:8px;cursor:pointer;transition:all 0.15s;"';
				s += ' onmouseenter="this.style.borderColor=\'#bfdbfe\'" onmouseleave="this.style.borderColor=\'#f1f5f9\'"';
				s += ' onclick="frappe.set_route(\'Form\',\'Inter Company Transfer\',\'' + row.name + '\')">';
				s += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">';
				s += '<span style="font-weight:700;color:#0891b2;font-size:11px;">' + row.name + '</span>';
				s += '<span class="oz-badge" style="color:#059669;background:#ecfdf5;">' + oz_k(row.grand_total) + '</span></div>';
				s += '<div class="oz-chain">';
				s += '<span class="oz-chain-step oz-chain-active">' + (row.company || '') + '</span>';
				s += '<span class="oz-chain-arrow">→</span>';
				s += '<span class="oz-chain-step oz-chain-active">' + (row.to_company || '') + '</span>';
				s += '<span style="margin-left:auto;font-size:9px;color:#94a3b8;">' + (row.item_list || row.items || '') + '</span></div>';
				s += '<div style="display:flex;gap:12px;font-size:9px;color:#94a3b8;margin-top:4px;">';
				s += '<span>' + oz_n(row.total_qty) + ' L</span>';
				s += '<span>' + (row.item_count || 0) + ' items</span>';
				s += '<span>' + frappe.datetime.str_to_user(row.posting_date) + '</span>';
				s += '<span class="oz-badge" style="color:#0891b2;background:#ecfeff;">' + (row.status || '') + '</span></div>';
				s += '</div>';
				return s;
			}
			var top3 = data.slice(0, 3);
			var rest = data.slice(3);
			var h = '';
			top3.forEach(function (row) { h += oz_ict_row(row); });
			if (rest.length > 0) {
				h += '<div id="oz-ict-more-wrap">';
				h += '<div style="text-align:center;margin:8px 0;">';
				h += '<a style="font-size:10px;font-weight:700;color:#0891b2;cursor:pointer;text-decoration:underline;" id="oz-ict-toggle">Show ' + rest.length + ' more \u25bc</a>';
				h += '</div>';
				h += '<div id="oz-ict-extra" style="display:none;">';
				rest.forEach(function (row) { h += oz_ict_row(row); });
				h += '</div></div>';
			}
			$('#oz-ict-chain').html(h);
			$('#oz-ict-toggle').on('click', function () {
				var ex = document.getElementById('oz-ict-extra');
				if (ex.style.display === 'none') { ex.style.display = 'block'; this.textContent = 'Show less \u25b2'; }
				else { ex.style.display = 'none'; this.textContent = 'Show ' + rest.length + ' more \u25bc'; }
			});
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


/* ═══════════ ICT ROUTES BREAKDOWN ═══════════ */
function oz_render_routes_breakdown(data) {
	var el = document.getElementById('oz-routes-breakdown');
	if (!el) return;
	if (!data || !data.length) { el.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:10px;">No routes found</div>'; return; }

	var gradients = [
		['#60a5fa', '#3b82f6', '#eff6ff'],
		['#a78bfa', '#8b5cf6', '#f5f3ff'],
		['#22d3ee', '#06b6d4', '#ecfeff'],
		['#fbbf24', '#f59e0b', '#fffbeb'],
		['#34d399', '#10b981', '#ecfdf5'],
		['#f87171', '#ef4444', '#fef2f2']
	];

	var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;">';
	data.forEach(function (r, idx) {
		var fromAbbr = r.company.replace(/^(\\S+).*/, '$1');
		var toAbbr = r.to_company.replace(/^(\\S+).*/, '$1');
		var items = (r.item_list || '').split(',').filter(Boolean);
		var grad = gradients[idx % gradients.length];
		var coEsc = r.company.replace(/'/g, "\\'");
		var toEsc = r.to_company.replace(/'/g, "\\'");
		var clickFn = "frappe.set_route('List','Inter Company Transfer',{company:'" + coEsc + "',to_company:'" + toEsc + "'})";

		html += '<div onclick="' + clickFn + '" style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:0;cursor:pointer;transition:all 0.25s cubic-bezier(0.4,0,0.2,1);overflow:hidden;"';
		html += ' onmouseenter="this.style.boxShadow=\'0 8px 24px rgba(0,0,0,0.1)\';this.style.transform=\'translateY(-3px)\';this.style.borderColor=\'' + grad[0] + '\'"';
		html += ' onmouseleave="this.style.boxShadow=\'none\';this.style.transform=\'none\';this.style.borderColor=\'#e2e8f0\'">';

		// Header bar with gradient
		html += '<div style="background:linear-gradient(135deg,' + grad[2] + ',#fff);border-bottom:1px solid ' + grad[0] + '30;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;">';
		html += '<div style="display:flex;align-items:center;gap:8px;">';
		html += '<div style="background:' + grad[0] + '18;border:1px solid ' + grad[0] + '30;border-radius:6px;padding:4px 10px;">';
		html += '<span style="font-size:11px;font-weight:800;color:' + grad[0] + ';">' + fromAbbr + '</span>';
		html += '</div>';
		html += '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9h10M10 5l4 4-4 4" stroke="' + grad[0] + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
		html += '<div style="background:' + grad[0] + '18;border:1px solid ' + grad[0] + '30;border-radius:6px;padding:4px 10px;">';
		html += '<span style="font-size:11px;font-weight:800;color:' + grad[0] + ';">' + toAbbr + '</span>';
		html += '</div>';
		html += '</div>';
		html += '<div style="background:' + grad[0] + ';border-radius:5px;padding:5px;margin:5px;display:inline-flex;align-items:center;">';
		html += '<span style="font-size:13px;font-weight:800;color:#fff;letter-spacing:0.5px;">' + r.cnt + '</span>';
		html += '</div>';
		html += '</div>';

		// Body
		html += '<div style="padding:12px 14px;">';

		// Stats row
		html += '<div style="display:flex;gap:16px;margin-bottom:10px;">';
		html += '<div style="flex:1;">';
		html += '<div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Volume</div>';
		html += '<div style="font-size:14px;font-weight:800;color:#0891b2;">' + oz_n(r.qty) + ' <span style="font-size:9px;font-weight:600;color:#94a3b8;">L</span></div>';
		html += '</div>';
		html += '<div style="flex:1;">';
		html += '<div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Value</div>';
		html += '<div style="font-size:14px;font-weight:800;color:#059669;">' + oz_k(r.value) + '</div>';
		html += '</div>';
		html += '</div>';

		// Item tags
		if (items.length > 0) {
			html += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
			items.slice(0, 4).forEach(function (it) {
				html += '<span style="display:inline-flex;align-items:center;background:' + grad[2] + ';color:' + grad[0] + ';font-size:8px;font-weight:700;padding:3px 7px;border-radius:5px;border:1px solid ' + grad[0] + '20;">' + it + '</span>';
			});
			if (items.length > 4) {
				html += '<span style="display:inline-flex;align-items:center;background:#f8fafc;color:#94a3b8;font-size:8px;font-weight:700;padding:3px 7px;border-radius:5px;border:1px solid #e2e8f0;">+' + (items.length - 4) + '</span>';
			}
			html += '</div>';
		}

		html += '</div>'; // body
		html += '</div>'; // card
	});
	html += '</div>';
	el.innerHTML = html;
}

/* ═══════════ RESERVED BY COMPANY ═══════════ */
function oz_render_reserved_by_company(data) {
	var el = document.getElementById('oz-res-by-company');
	if (!el) return;
	if (!data || !data.length) { el.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:10px;">No data</div>'; return; }
	var maxVal = 0;
	data.forEach(function (r) { if (r.value > maxVal) maxVal = r.value; });
	var html = '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
	data.forEach(function (r) {
		var pct = maxVal > 0 ? (r.value / maxVal) * 100 : 0;
		var abbr = r.company.replace(/^(\S+).*/, '$1');
		html += '<div style="flex:1;min-width:160px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;">';
		html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">';
		html += '<span style="font-size:11px;font-weight:700;color:#1e293b;">' + abbr + '</span>';
		html += '<span style="font-size:10px;font-weight:800;color:#d97706;">' + oz_n(r.qty) + ' L</span>';
		html += '</div>';
		html += '<div style="height:4px;border-radius:4px;background:#f1f5f9;overflow:hidden;margin-bottom:4px;">';
		html += '<div style="height:100%;width:' + pct + '%;border-radius:4px;background:linear-gradient(90deg,#f59e0b,#d97706);transition:width 0.8s cubic-bezier(0.22,1,0.36,1);"></div></div>';
		html += '<div style="font-size:8px;font-weight:700;color:#94a3b8;text-align:right;">' + oz_k(r.value) + '</div>';
		html += '</div>';
	});
	html += '</div>';
	el.innerHTML = html;
}
}
