frappe.query_reports["Negative Stock Report"] = {
	"filters": [
		{ "fieldname": "company", "label": "Company", "fieldtype": "Link", "options": "Company", "default": frappe.defaults.get_default("company") },
		{ "fieldname": "warehouse", "label": "Warehouse", "fieldtype": "Link", "options": "Warehouse" },
		{ "fieldname": "item_code", "label": "Item", "fieldtype": "Link", "options": "Item" },
	],

	format: function (report) {
		var data = report.data || [];
		var summary = report.report_summary || [];

		var h = '<div style="padding:12px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">';

		// KPI cards
		if (summary.length) {
			h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-bottom:16px;">';
			summary.forEach(function (k) {
				var c = k.indicator === 'red' ? '#dc2626' : k.indicator === 'green' ? '#10b981' : '#64748b';
				var bg = k.indicator === 'red' ? '#fef2f2' : k.indicator === 'green' ? '#ecfdf5' : '#f8fafc';
				h += '<div style="background:' + bg + ';border:1px solid #f1f5f9;border-left:3px solid ' + c + ';border-radius:10px;padding:12px;">';
				h += '<div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;">' + k.label + '</div>';
				h += '<div style="font-size:20px;font-weight:800;color:' + c + ';margin-top:2px;">' + k.value + '</div>';
				h += '</div>';
			});
			h += '</div>';
		}

		if (data.length) {
			// Group by company
			var byCo = {};
			data.forEach(function (row) {
				if (!byCo[row.company]) byCo[row.company] = [];
				byCo[row.company].push(row);
			});

			Object.keys(byCo).forEach(function (co) {
				var rows = byCo[co];
				var coVal = rows.reduce(function (s, r) { return s + Math.abs(r.stock_value || 0); }, 0);
				var coQty = rows.reduce(function (s, r) { return s + Math.abs(r.qty || 0); }, 0);

				h += '<div style="background:#fff;border:1px solid #fecaca;border-radius:12px;margin-bottom:12px;overflow:hidden;border-left:4px solid #dc2626;">';
				// Header
				h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #fef2f2;background:#fffafa;">';
				h += '<div style="display:flex;align-items:center;gap:8px;">';
				h += '<span style="font-size:12px;font-weight:800;color:#dc2626;">' + co + '</span>';
				h += '<span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;background:#fef2f2;color:#dc2626;">' + rows.length + ' items</span>';
				h += '</div>';
				h += '<div style="display:flex;gap:16px;">';
				h += '<div style="text-align:right;"><div style="font-size:8px;font-weight:700;color:#94a3b8;">NEG QTY</div><div style="font-size:14px;font-weight:800;color:#dc2626;">' + frappe.utils.fmt_money(coQty) + '</div></div>';
				h += '<div style="text-align:right;"><div style="font-size:8px;font-weight:700;color:#94a3b8;">NEG VALUE</div><div style="font-size:14px;font-weight:800;color:#dc2626;">' + frappe.utils.fmt_money(coVal) + '</div></div>';
				h += '</div></div>';

				// Table
				h += '<table style="width:100%;border-collapse:collapse;font-size:11px;">';
				h += '<thead><tr>';
				h += '<th style="text-align:left;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #fef2f2;">Warehouse</th>';
				h += '<th style="text-align:left;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #fef2f2;">Item</th>';
				h += '<th style="text-align:right;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #fef2f2;">Qty</th>';
				h += '<th style="text-align:right;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #fef2f2;">Rate</th>';
				h += '<th style="text-align:right;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #fef2f2;">Stock Value</th>';
				h += '</tr></thead><tbody>';

				rows.forEach(function (row) {
					h += '<tr onclick="frappe.set_route(\'Form\',\'Bin\',\'' + row.warehouse + '/' + row.item_code + '\')" style="cursor:pointer;" onmouseenter="this.style.background=\'#fffafa\'" onmouseleave="this.style.background=\'transparent\'">';
					h += '<td style="padding:8px 12px;color:#64748b;border-top:1px solid #fef2f2;">' + (row.warehouse || '') + '</td>';
					h += '<td style="padding:8px 12px;font-weight:700;color:#1e293b;border-top:1px solid #fef2f2;">' + (row.item_code || '') + '</td>';
					h += '<td style="padding:8px 12px;text-align:right;font-weight:800;color:#dc2626;border-top:1px solid #fef2f2;">' + frappe.utils.fmt_money(row.qty || 0) + '</td>';
					h += '<td style="padding:8px 12px;text-align:right;color:#64748b;border-top:1px solid #fef2f2;">' + frappe.utils.fmt_money(row.valuation_rate || 0) + '</td>';
					h += '<td style="padding:8px 12px;text-align:right;font-weight:700;color:#dc2626;border-top:1px solid #fef2f2;">' + frappe.utils.fmt_money(row.stock_value || 0) + '</td>';
					h += '</tr>';
				});
				h += '</tbody></table></div>';
			});
		} else {
			h += '<div style="text-align:center;padding:40px;color:#059669;font-weight:600;">✓ All clear — no negative stock found</div>';
		}

		h += '</div>';
		frappe.query_report.page.main.find('.result').html(h);
	}
};
