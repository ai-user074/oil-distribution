frappe.query_reports["Available Vs Reserved"] = {
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
			// Group by company
			var byCo = {};
			data.forEach(function (row) {
				if (!byCo[row.company]) byCo[row.company] = { items: [], total_avail: 0, total_reserved: 0 };
				byCo[row.company].items.push(row);
				byCo[row.company].total_avail += (row.available_qty || 0);
				byCo[row.company].total_reserved += (row.reserved_qty || 0);
			});

			var coColors = { 'Geeta Enterprise': '#3b82f6', 'Global Export': '#10b981', 'Shubham Enterprise': '#f59e0b' };

			Object.keys(byCo).forEach(function (co) {
				var c = byCo[co];
				var accent = coColors[co] || '#64748b';
				var total = c.total_avail + c.total_reserved;
				var availPct = total > 0 ? Math.round((c.total_avail / total) * 100) : 100;

				h += '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px;overflow:hidden;border-left:4px solid ' + accent + ';">';
				// Company header
				h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #f1f5f9;background:#fafbfc;">';
				h += '<div style="display:flex;align-items:center;gap:8px;">';
				h += '<span style="font-size:12px;font-weight:800;color:' + accent + ';">' + co + '</span>';
				h += '<span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;background:' + accent + '20;color:' + accent + ';">' + c.items.length + ' items</span>';
				h += '</div>';
				h += '<div style="display:flex;gap:16px;">';
				h += '<div style="text-align:right;"><div style="font-size:8px;font-weight:700;color:#10b981;">AVAILABLE</div><div style="font-size:14px;font-weight:800;color:#10b981;">' + frappe.utils.fmt_money(c.total_avail) + '</div></div>';
				h += '<div style="text-align:right;"><div style="font-size:8px;font-weight:700;color:#f59e0b;">RESERVED</div><div style="font-size:14px;font-weight:800;color:#f59e0b;">' + frappe.utils.fmt_money(c.total_reserved) + '</div></div>';
				h += '</div></div>';

				// Utilization bar
				h += '<div style="padding:8px 16px;background:#fafbfc;border-bottom:1px solid #f1f5f9;">';
				h += '<div style="display:flex;align-items:center;gap:8px;">';
				h += '<div style="flex:1;height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden;">';
				h += '<div style="height:100%;width:' + availPct + '%;background:linear-gradient(90deg,#10b981,#3b82f6);border-radius:3px;"></div></div>';
				h += '<span style="font-size:9px;font-weight:700;color:' + accent + ';">' + availPct + '% available</span></div></div>';

				// Table
				h += '<table style="width:100%;border-collapse:collapse;font-size:11px;">';
				h += '<thead><tr>';
				h += '<th style="text-align:left;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Warehouse</th>';
				h += '<th style="text-align:left;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Item</th>';
				h += '<th style="text-align:right;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Available</th>';
				h += '<th style="text-align:right;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Reserved</th>';
				h += '<th style="text-align:right;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Net</th>';
				h += '<th style="width:100px;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Ratio</th>';
				h += '</tr></thead><tbody>';

				c.items.forEach(function (row) {
					var net = row.net_available || 0;
					var netColor = net < 0 ? '#dc2626' : '#10b981';
					var rowTotal = (row.available_qty || 0) + (row.reserved_qty || 0);
					var rowPct = rowTotal > 0 ? Math.round((row.available_qty / rowTotal) * 100) : 100;

					h += '<tr onmouseenter="this.style.background=\'#f8fafc\'" onmouseleave="this.style.background=\'transparent\'">';
					h += '<td style="padding:8px 12px;color:#64748b;border-top:1px solid #f8fafc;">' + (row.warehouse || '').replace(' - ' + (co === 'Geeta Enterprise' ? 'GE' : co === 'Global Export' ? 'GEX' : 'SHE'), '') + '</td>';
					h += '<td style="padding:8px 12px;font-weight:700;color:#1e293b;border-top:1px solid #f8fafc;">' + (row.item_code || '') + '</td>';
					h += '<td style="padding:8px 12px;text-align:right;font-weight:800;color:#10b981;border-top:1px solid #f8fafc;">' + frappe.utils.fmt_money(row.available_qty || 0) + '</td>';
					h += '<td style="padding:8px 12px;text-align:right;font-weight:800;color:#f59e0b;border-top:1px solid #f8fafc;">' + frappe.utils.fmt_money(row.reserved_qty || 0) + '</td>';
					h += '<td style="padding:8px 12px;text-align:right;font-weight:800;color:' + netColor + ';border-top:1px solid #f8fafc;">' + frappe.utils.fmt_money(net) + '</td>';
					h += '<td style="padding:8px 12px;border-top:1px solid #f8fafc;"><div style="display:flex;align-items:center;gap:4px;"><div style="flex:1;height:4px;background:#f1f5f9;border-radius:2px;overflow:hidden;"><div style="height:100%;width:' + rowPct + '%;background:' + accent + ';border-radius:2px;"></div></div><span style="font-size:8px;font-weight:700;color:' + accent + ';">' + rowPct + '%</span></div></td>';
					h += '</tr>';
				});
				h += '</tbody></table></div>';
			});
		} else {
			h += '<div style="text-align:center;padding:40px;color:#94a3b8;">No stock data found</div>';
		}

		h += '</div>';
		frappe.query_report.page.main.find('.result').html(h);
	}
};
