frappe.query_reports["Reserved Stock"] = {
	"filters": [
		{ "fieldname": "company", "label": "Company", "fieldtype": "Link", "options": "Company", "default": frappe.defaults.get_default("company") },
		{ "fieldname": "warehouse", "label": "Warehouse", "fieldtype": "Link", "options": "Warehouse" },
		{ "fieldname": "item", "label": "Item", "fieldtype": "Link", "options": "Item" },
		{ "fieldname": "status", "label": "Status", "fieldtype": "Select", "options": "\nDraft\nReserved\nReleased\nCancelled" },
	],

	format: function (report) {
		var data = report.data || [];
		var summary = report.report_summary || [];

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

		if (data.length) {
			// Group by status
			var byStatus = {};
			data.forEach(function (row) {
				var st = row.status || 'Reserved';
				if (!byStatus[st]) byStatus[st] = [];
				byStatus[st].push(row);
			});

			var statusColors = { 'Reserved': '#f59e0b', 'Draft': '#94a3b8', 'Released': '#10b981', 'Cancelled': '#dc2626' };

			Object.keys(byStatus).forEach(function (st) {
				var rows = byStatus[st];
				var sc = statusColors[st] || '#64748b';
				var totalQty = rows.reduce(function (s, r) { return s + (r.reserved_qty || 0); }, 0);

				h += '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px;overflow:hidden;">';
				// Header
				h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #f1f5f9;background:#fafbfc;">';
				h += '<div style="display:flex;align-items:center;gap:8px;">';
				h += '<span style="width:10px;height:10px;border-radius:3px;background:' + sc + ';"></span>';
				h += '<span style="font-size:12px;font-weight:700;color:#1e293b;">' + st + '</span>';
				h += '<span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;background:' + sc + '20;color:' + sc + ';">' + rows.length + ' reservations</span>';
				h += '</div>';
				h += '<span style="font-size:13px;font-weight:800;color:' + sc + ';">' + frappe.utils.fmt_money(totalQty) + ' L</span>';
				h += '</div>';

				// Table
				h += '<table style="width:100%;border-collapse:collapse;font-size:11px;">';
				h += '<thead><tr>';
				h += '<th style="text-align:left;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Reservation</th>';
				h += '<th style="text-align:left;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Company</th>';
				h += '<th style="text-align:left;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Warehouse</th>';
				h += '<th style="text-align:left;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Item</th>';
				h += '<th style="text-align:right;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Qty</th>';
				h += '<th style="text-align:left;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Reserved For</th>';
				h += '<th style="text-align:left;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Date</th>';
				h += '</tr></thead><tbody>';

				rows.forEach(function (row) {
					h += '<tr onclick="frappe.set_route(\'Form\',\'Stock Reservation\',\'' + row.reservation + '\')" style="cursor:pointer;" onmouseenter="this.style.background=\'#f8fafc\'" onmouseleave="this.style.background=\'transparent\'">';
					h += '<td style="padding:8px 12px;font-weight:700;color:#3b82f6;border-top:1px solid #f8fafc;">' + row.reservation + '</td>';
					h += '<td style="padding:8px 12px;border-top:1px solid #f8fafc;"><span style="font-weight:600;color:#1e293b;">' + (row.company || '').replace(' Enterprise', '').replace(' Export', '') + '</span></td>';
					h += '<td style="padding:8px 12px;font-size:10px;color:#64748b;border-top:1px solid #f8fafc;">' + (row.warehouse || '') + '</td>';
					h += '<td style="padding:8px 12px;font-weight:700;color:#1e293b;border-top:1px solid #f8fafc;">' + (row.item || '') + '</td>';
					h += '<td style="padding:8px 12px;text-align:right;font-weight:800;color:' + sc + ';border-top:1px solid #f8fafc;">' + frappe.utils.fmt_money(row.reserved_qty || 0) + '</td>';
					h += '<td style="padding:8px 12px;color:#64748b;border-top:1px solid #f8fafc;">' + (row.reserved_for || '') + '</td>';
					h += '<td style="padding:8px 12px;color:#64748b;border-top:1px solid #f8fafc;">' + (row.posting_date || '') + '</td>';
					h += '</tr>';
				});
				h += '</tbody></table></div>';
			});
		} else {
			h += '<div style="text-align:center;padding:40px;color:#94a3b8;">No reserved stock found</div>';
		}

		h += '</div>';
		frappe.query_report.page.main.find('.result').html(h);
	}
};
