frappe.pages['oil-command-center'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Oil Distribution Command Center',
		single_column: true,
	});

	page.main.html(get_dashboard_html());

	// Add Refresh button
	page.add_button(__("Refresh"), function () {
		load_all_data();
	}, "refresh");

	load_all_data();
};

function get_dashboard_html() {
	return `
	<style>
		.kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
		.kpi-card {
			padding: 18px 20px; border-radius: 10px; color: #fff; cursor: pointer;
			box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.15s, box-shadow 0.15s;
		}
		.kpi-card:hover { transform: translateY(-3px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
		.kpi-card .kpi-label { font-size: 12px; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.5px; }
		.kpi-card .kpi-value { font-size: 26px; font-weight: 700; margin-top: 4px; }
		.kpi-card .kpi-sub { font-size: 11px; opacity: 0.65; margin-top: 2px; }
		.kpi-blue { background: linear-gradient(135deg, #1f6feb, #3b82f6); }
		.kpi-green { background: linear-gradient(135deg, #059669, #10b981); }
		.kpi-orange { background: linear-gradient(135deg, #d97706, #f59e0b); }
		.kpi-red { background: linear-gradient(135deg, #dc2626, #ef4444); }
		.kpi-purple { background: linear-gradient(135deg, #7c3aed, #a78bfa); }
		.kpi-teal { background: linear-gradient(135deg, #0d9488, #14b8a6); }

		.section-title {
			font-size: 15px; font-weight: 600; color: #374151;
			margin: 20px 0 12px; padding-bottom: 6px;
			border-bottom: 2px solid #e5e7eb;
		}
		.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
		.chart-card {
			background: #fff; border-radius: 10px; padding: 18px;
			box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;
		}
		.chart-card h4 { font-size: 13px; font-weight: 600; color: #374151; margin: 0 0 12px; }

		.tables-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
		.table-card {
			background: #fff; border-radius: 10px; padding: 18px;
			box-shadow: 0 1px 4px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;
		}
		.table-card h4 {
			font-size: 13px; font-weight: 600; color: #374151; margin: 0 0 10px;
			display: flex; justify-content: space-between; align-items: center;
		}
		.table-card h4 a { font-size: 11px; color: #1f6feb; cursor: pointer; text-decoration: none; }
		.table-card h4 a:hover { text-decoration: underline; }
		.table-card table { font-size: 12px; width: 100%; }
		.table-card th { background: #f9fafb; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
		.table-card td { vertical-align: middle; }
		.neg-qty { color: #dc2626; font-weight: 700; }
		.badge-reserved { background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
		.badge-submitted { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
		.clickable-row { cursor: pointer; transition: background 0.1s; }
		.clickable-row:hover { background: #f0f9ff; }
		.empty-state { text-align: center; padding: 24px; color: #9ca3af; font-size: 12px; }
		.full-width { grid-column: 1 / -1; }
	</style>

	<div style="padding: 4px;">
		<!-- KPI ROW 1 -->
		<div class="kpi-row">
			<div class="kpi-card kpi-blue" onclick="frappe.set_route('List', 'Sales Invoice');">
				<div class="kpi-label">Total Sales (MTD)</div>
				<div class="kpi-value" id="kpi-sales">--</div>
				<div class="kpi-sub">Click to view Sales Invoices</div>
			</div>
			<div class="kpi-card kpi-green" onclick="frappe.set_route('List', 'Purchase Invoice');">
				<div class="kpi-label">Total Procurement (MTD)</div>
				<div class="kpi-value" id="kpi-proc">--</div>
				<div class="kpi-sub">Click to view Purchase Invoices</div>
			</div>
			<div class="kpi-card kpi-orange" onclick="frappe.set_route('List', 'Bin', {'warehouse': ['like', 'Available WH%']});">
				<div class="kpi-label">Available Stock</div>
				<div class="kpi-value" id="kpi-avail">--</div>
				<div class="kpi-sub">Click to view Available Bins</div>
			</div>
		</div>

		<!-- KPI ROW 2 -->
		<div class="kpi-row">
			<div class="kpi-card kpi-purple" onclick="frappe.set_route('List', 'Stock Reservation', {'status': 'Reserved'});">
				<div class="kpi-label">Swastik Reserved</div>
				<div class="kpi-value" id="kpi-reserved">--</div>
				<div class="kpi-sub">Click to view Reservations</div>
			</div>
			<div class="kpi-card kpi-red" onclick="frappe.set_route('List', 'Bin', {'actual_qty': ['<', 0]});">
				<div class="kpi-label">Negative Stock Alerts</div>
				<div class="kpi-value" id="kpi-negative">--</div>
				<div class="kpi-sub">Click to view negative bins</div>
			</div>
			<div class="kpi-card kpi-teal" onclick="frappe.set_route('List', 'Inter Company Transfer', {'docstatus': 1});">
				<div class="kpi-label">Intercompany Volume (MTD)</div>
				<div class="kpi-value" id="kpi-ict">--</div>
				<div class="kpi-sub">Click to view ICTs</div>
			</div>
		</div>

		<!-- CHARTS -->
		<div class="section-title">Interactive Analytics</div>
		<div class="charts-row">
			<div class="chart-card">
				<h4>Sales vs Procurement Trend (6 Months)</h4>
				<div id="chart-trend"></div>
			</div>
			<div class="chart-card">
				<h4>Company-wise Stock Distribution</h4>
				<div id="chart-donut"></div>
			</div>
		</div>

		<!-- TABLES -->
		<div class="section-title">Live Data</div>
		<div class="tables-row">
			<div class="table-card">
				<h4>Active Swastik Reservations <a onclick="frappe.set_route('List', 'Stock Reservation', {'status': 'Reserved'});">View All</a></h4>
				<div id="table-reservations"><div class="empty-state">Loading...</div></div>
			</div>
			<div class="table-card">
				<h4>Recent Intercompany Transfers <a onclick="frappe.set_route('List', 'Inter Company Transfer');">View All</a></h4>
				<div id="table-icts"><div class="empty-state">Loading...</div></div>
			</div>
		</div>

		<div class="tables-row">
			<div class="table-card full-width">
				<h4>Negative Stock Alerts <a onclick="frappe.set_route('List', 'Bin', {'actual_qty': ['<', 0]});">View All</a></h4>
				<div id="table-negative"><div class="empty-state">Loading...</div></div>
			</div>
		</div>
	</div>`;
}

function load_all_data() {
	// Reset to loading state
	$('#kpi-sales, #kpi-proc, #kpi-avail, #kpi-reserved, #kpi-negative, #kpi-ict').text('--');
	$('#chart-trend, #chart-donut, #table-reservations, #table-icts, #table-negative').html('<div class="empty-state">Loading...</div>');

	// KPIs
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_kpis',
		callback: function (r) {
			if (!r.message) return;
			var d = r.message;
			$('#kpi-sales').text(format_currency(d.sales_mtd));
			$('#kpi-proc').text(format_currency(d.procurement_mtd));
			$('#kpi-avail').text(format_number(d.available_stock) + ' L');
			$('#kpi-reserved').text(format_number(d.reserved_stock) + ' L');
			$('#kpi-negative').text(d.negative_alerts + ' Alerts');
			$('#kpi-ict').text(format_number(d.intercompany_volume) + ' L');
		},
	});

	// Trend Chart
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_sales_procurement_trend',
		callback: function (r) {
			if (!r.message) return;
			var d = r.message;
			$('#chart-trend').empty();
			new frappe.Chart('#chart-trend', {
				data: {
					labels: d.labels,
					datasets: [
						{ name: 'Sales', values: d.sales, chartType: 'line' },
						{ name: 'Procurement', values: d.purchase, chartType: 'line' },
					],
				},
				type: 'line',
				height: 240,
				colors: ['#1f6feb', '#10b981'],
				lineOptions: { dotSize: 4, hideDots: 0 },
				axisOptions: { xAxisMode: 'tick', yAxisMode: 'tick', yAxis: { format: function(v) { return '₹' + format_number(v); } } },
				tooltipOptions: { formatTooltipY: function(v) { return '₹' + format_number(v); } },
			});
		},
	});

	// Donut Chart
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_company_stock_distribution',
		callback: function (r) {
			if (!r.message) return;
			var d = r.message;
			$('#chart-donut').empty();
			new frappe.Chart('#chart-donut', {
				data: {
					labels: d.labels,
					datasets: [{ values: d.values }],
				},
				type: 'donut',
				height: 240,
				colors: ['#1f6feb', '#10b981', '#f59e0b', '#a78bfa'],
				tooltipOptions: { formatTooltipY: function(v) { return format_number(v) + ' L'; } },
			});
		},
	});

	// Reservations Table
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_recent_reservations',
		callback: function (r) {
			if (!r.message || !r.message.length) {
				$('#table-reservations').html('<div class="empty-state">No active reservations</div>');
				return;
			}
			var html = '<table class="table table-sm table-bordered"><thead><tr><th>ID</th><th>Company</th><th>Item</th><th>Qty</th><th>For</th><th>Status</th></tr></thead><tbody>';
			r.message.forEach(function (row) {
				html += '<tr class="clickable-row" onclick="frappe.set_route(\'Form\', \'Stock Reservation\', \'' + row.name + '\');">';
				html += '<td><strong>' + row.name + '</strong></td>';
				html += '<td>' + (row.company || '') + '</td>';
				html += '<td>' + (row.item || '') + '</td>';
				html += '<td><strong>' + format_number(row.reserved_qty) + '</strong></td>';
				html += '<td>' + (row.reserved_for || '') + '</td>';
				html += '<td><span class="badge-reserved">' + (row.status || '') + '</span></td>';
				html += '</tr>';
			});
			html += '</tbody></table>';
			$('#table-reservations').html(html);
		},
	});

	// ICT Table
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_recent_icts',
		callback: function (r) {
			if (!r.message || !r.message.length) {
				$('#table-icts').html('<div class="empty-state">No transfers yet</div>');
				return;
			}
			var html = '<table class="table table-sm table-bordered"><thead><tr><th>ID</th><th>From</th><th>To</th><th>Qty</th><th>Value</th><th>Date</th></tr></thead><tbody>';
			r.message.forEach(function (row) {
				html += '<tr class="clickable-row" onclick="frappe.set_route(\'Form\', \'Inter Company Transfer\', \'' + row.name + '\');">';
				html += '<td><strong>' + row.name + '</strong></td>';
				html += '<td>' + (row.company || '') + '</td>';
				html += '<td>' + (row.to_company || '') + '</td>';
				html += '<td><strong>' + format_number(row.total_qty) + '</strong></td>';
				html += '<td>' + format_currency(row.grand_total) + '</td>';
				html += '<td>' + frappe.datetime.str_to_user(row.posting_date) + '</td>';
				html += '</tr>';
			});
			html += '</tbody></table>';
			$('#table-icts').html(html);
		},
	});

	// Negative Stock Table
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_negative_stock',
		callback: function (r) {
			if (!r.message || !r.message.length) {
				$('#table-negative').html('<div class="empty-state">No negative stock - all clear!</div>');
				return;
			}
			var html = '<table class="table table-sm table-bordered"><thead><tr><th>Company</th><th>Warehouse</th><th>Item</th><th>Neg Qty</th><th>Value</th></tr></thead><tbody>';
			r.message.forEach(function (row) {
				html += '<tr class="clickable-row" onclick="frappe.set_route(\'Form\', \'Bin\', \'' + row.warehouse + '/' + row.item_code + '\');">';
				html += '<td>' + (row.company || '') + '</td>';
				html += '<td>' + (row.warehouse || '') + '</td>';
				html += '<td>' + (row.item_code || '') + '</td>';
				html += '<td class="neg-qty">' + format_number(row.actual_qty) + '</td>';
				html += '<td>' + format_currency(row.stock_value) + '</td>';
				html += '</tr>';
			});
			html += '</tbody></table>';
			$('#table-negative').html(html);
		},
	});
}
