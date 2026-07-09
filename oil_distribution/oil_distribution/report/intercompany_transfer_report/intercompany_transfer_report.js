frappe.query_reports["Intercompany Transfer Report"] = {
	"filters": [
		{ "fieldname": "from_company", "label": "From Company", "fieldtype": "Link", "options": "Company" },
		{ "fieldname": "to_company", "label": "To Company", "fieldtype": "Link", "options": "Company" },
		{ "fieldname": "posting_date", "label": "Posting Date", "fieldtype": "DateRange" },
	],

	format: function (report) {
		var data = report.data || [];
		var summary = report.report_summary || [];
		var chart_data = report.chart ? report.chart.data : null;

		var h = '<div style="padding:12px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">';

		// KPI cards
		if (summary.length) {
			h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:16px;">';
			summary.forEach(function (k) {
				var colors = { blue: '#3b82f6', green: '#10b981', orange: '#f59e0b', red: '#dc2626' };
				var bgColors = { blue: '#eff6ff', green: '#ecfdf5', orange: '#fef3c7', red: '#fef2f2' };
				var c = colors[k.indicator] || '#64748b';
				var bg = bgColors[k.indicator] || '#f8fafc';
				h += '<div style="background:' + bg + ';border:1px solid #f1f5f9;border-left:3px solid ' + c + ';border-radius:10px;padding:12px;">';
				h += '<div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;">' + k.label + '</div>';
				h += '<div style="font-size:20px;font-weight:800;color:' + c + ';margin-top:2px;">' + k.value + '</div>';
				h += '</div>';
			});
			h += '</div>';
		}

		// Chart
		if (chart_data) {
			h += '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:16px;">';
			h += '<div style="font-size:11px;font-weight:700;color:#1e293b;margin-bottom:8px;">Transfer Value by Route</div>';
			h += '<div id="ict-report-chart"></div>';
			h += '</div>';
		}

		// Data grouped by status
		if (data.length) {
			var byStatus = {};
			data.forEach(function (row) {
				var st = row.status || 'Draft';
				if (!byStatus[st]) byStatus[st] = [];
				byStatus[st].push(row);
			});

			var statusColors = { 'Completed': '#10b981', 'Transferred': '#3b82f6', 'Draft': '#94a3b8', 'Cancelled': '#dc2626', 'Rejected': '#dc2626' };

			Object.keys(byStatus).forEach(function (st) {
				var rows = byStatus[st];
				var sc = statusColors[st] || '#64748b';
				var total = rows.reduce(function (s, r) { return s + (r.grand_total || 0); }, 0);

				h += '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px;overflow:hidden;">';
				// Header
				h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #f1f5f9;background:#fafbfc;">';
				h += '<div style="display:flex;align-items:center;gap:8px;">';
				h += '<span style="font-size:12px;font-weight:700;color:#1e293b;">' + st + '</span>';
				h += '<span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;background:' + sc + '20;color:' + sc + ';">' + rows.length + ' transfers</span>';
				h += '</div>';
				h += '<span style="font-size:13px;font-weight:800;color:' + sc + ';">' + frappe.datetime.str_to_user(frappe.utils.fmt_money(total)) + '</span>';
				h += '</div>';

				// Table
				h += '<table style="width:100%;border-collapse:collapse;font-size:11px;">';
				h += '<thead><tr>';
				h += '<th style="text-align:left;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Transfer</th>';
				h += '<th style="text-align:left;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Route</th>';
				h += '<th style="text-align:left;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Date</th>';
				h += '<th style="text-align:right;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Amount</th>';
				h += '</tr></thead><tbody>';

				rows.forEach(function (row) {
					h += '<tr onclick="frappe.set_route(\'Form\',\'Inter Company Transfer\',\'' + row.transfer + '\')" style="cursor:pointer;" onmouseenter="this.style.background=\'#f8fafc\'" onmouseleave="this.style.background=\'transparent\'">';
					h += '<td style="padding:8px 12px;font-weight:700;color:#3b82f6;border-top:1px solid #f8fafc;">' + row.transfer + '</td>';
					h += '<td style="padding:8px 12px;border-top:1px solid #f8fafc;">';
					h += '<span style="font-weight:600;color:#1e293b;">' + (row.from_company || '').replace(' Enterprise', '').replace(' Export', '') + '</span>';
					h += ' <span style="color:#94a3b8;">→</span> ';
					h += '<span style="font-weight:600;color:#1e293b;">' + (row.to_company || '').replace(' Enterprise', '').replace(' Export', '') + '</span></td>';
					h += '<td style="padding:8px 12px;color:#64748b;border-top:1px solid #f8fafc;">' + (row.posting_date || '') + '</td>';
					h += '<td style="padding:8px 12px;text-align:right;font-weight:700;color:#1e293b;border-top:1px solid #f8fafc;">' + frappe.utils.fmt_money(row.grand_total || 0) + '</td>';
					h += '</tr>';
				});
				h += '</tbody></table></div>';
			});
		} else {
			h += '<div style="text-align:center;padding:40px;color:#94a3b8;">No transfers found</div>';
		}

		h += '</div>';

		frappe.query_report.page.main.find('.result').html(h);

		// Render chart
		if (chart_data) {
			setTimeout(function () {
				var el = document.getElementById('ict-report-chart');
				if (el) {
					frappe.query_report.chart = new frappe.Chart(el, {
						data: chart_data,
						type: 'bar',
						colors: ['#3b82f6', '#10b981', '#f59e0b', '#7c3aed'],
						axisOptions: { xAxisMode: 'tick', yAxisMode: 'tick' },
						barOptions: { stacked: false, spaceRatio: 0.5 },
					});
				}
			}, 100);
		}
	}
};
