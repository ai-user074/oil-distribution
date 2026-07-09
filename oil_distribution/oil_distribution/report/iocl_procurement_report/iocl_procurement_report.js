frappe.query_reports["IOCL Procurement Report"] = {
	"filters": [
		{ "fieldname": "company", "label": "Company", "fieldtype": "Link", "options": "Company", "default": frappe.defaults.get_default("company") },
		{ "fieldname": "supplier", "label": "Supplier", "fieldtype": "Link", "options": "Supplier" },
		{ "fieldname": "from_date", "label": "From Date", "fieldtype": "Date" },
		{ "fieldname": "to_date", "label": "To Date", "fieldtype": "Date" },
	],

	format: function (report) {
		var data = report.data || [];
		var summary = report.report_summary || [];

		var h = '<div style="padding:12px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">';

		// KPI cards
		if (summary.length) {
			h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:16px;">';
			summary.forEach(function (k) {
				var colors = { blue: '#3b82f6', green: '#10b981', orange: '#f59e0b', red: '#dc2626' };
				var bgColors = { blue: '#eff6ff', green: '#ecfdf5', orange: '#fef3c7', red: '#fef2f2' };
				var c = colors[k.indicator] || '#64748b';
				var bg = bgColors[k.indicator] || '#f8fafc';
				h += '<div style="background:' + bg + ';border:1px solid #f1f5f9;border-left:3px solid ' + c + ';border-radius:10px;padding:12px;">';
				h += '<div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;">' + k.label + '</div>';
				h += '<div style="font-size:18px;font-weight:800;color:' + c + ';margin-top:2px;">' + k.value + '</div>';
				h += '</div>';
			});
			h += '</div>';
		}

		if (data.length) {
			// Group by PO
			var byPO = {};
			data.forEach(function (row) {
				if (!byPO[row.name]) byPO[row.name] = { company: row.company, date: row.transaction_date, status: row.status, items: [], total_po: 0, total_received: 0, total_pending: 0 };
				byPO[row.name].items.push(row);
				byPO[row.name].total_po += (row.po_amount || 0);
				byPO[row.name].total_received += (row.received_amount || 0);
				byPO[row.name].total_pending += (row.pending_amount || 0);
			});

			var statusColors = { 'Completed': '#10b981', 'Closed': '#10b981', 'Submitted': '#3b82f6', 'Draft': '#94a3b8', 'Cancelled': '#dc2626', 'Rejected': '#dc2626' };
			var coColors = { 'Geeta Enterprise': '#3b82f6', 'Global Export': '#10b981', 'Shubham Enterprise': '#f59e0b' };

			Object.keys(byPO).forEach(function (poName) {
				var po = byPO[poName];
				var sc = statusColors[po.status] || '#64748b';
				var accent = coColors[po.company] || '#3b82f6';
				var totalItems = po.items.length;
				var avgPct = po.items.reduce(function (s, r) { return s + (r.receipt_pct || 0); }, 0) / totalItems;

				h += '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px;overflow:hidden;">';
				// PO header
				h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #f1f5f9;background:#fafbfc;">';
				h += '<div style="display:flex;align-items:center;gap:8px;">';
				h += '<span style="font-size:12px;font-weight:800;color:' + accent + ';">' + poName + '</span>';
				h += '<span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;background:' + sc + '20;color:' + sc + ';">' + po.status + '</span>';
				h += '<span style="font-size:9px;color:#94a3b8;">' + (po.date || '') + ' · ' + totalItems + ' items</span>';
				h += '</div>';
				h += '<div style="display:flex;gap:16px;">';
				h += '<div style="text-align:right;"><div style="font-size:8px;font-weight:700;color:#94a3b8;">PO VALUE</div><div style="font-size:13px;font-weight:800;color:' + accent + ';">' + frappe.utils.fmt_money(po.total_po) + '</div></div>';
				h += '<div style="text-align:right;"><div style="font-size:8px;font-weight:700;color:#94a3b8;">RECEIVED</div><div style="font-size:13px;font-weight:800;color:#10b981;">' + frappe.utils.fmt_money(po.total_received) + '</div></div>';
				h += '<div style="text-align:right;"><div style="font-size:8px;font-weight:700;color:#94a3b8;">PENDING</div><div style="font-size:13px;font-weight:800;color:#f59e0b;">' + frappe.utils.fmt_money(po.total_pending) + '</div></div>';
				h += '</div></div>';

				// Overall progress bar
				h += '<div style="padding:8px 16px;background:#fafbfc;border-bottom:1px solid #f1f5f9;">';
				h += '<div style="display:flex;align-items:center;gap:8px;">';
				h += '<div style="flex:1;height:6px;background:#f1f5f9;border-radius:3px;overflow:hidden;">';
				h += '<div style="height:100%;width:' + Math.min(avgPct, 100) + '%;background:linear-gradient(90deg,#10b981,#3b82f6);border-radius:3px;"></div></div>';
				h += '<span style="font-size:9px;font-weight:700;color:' + accent + ';">' + Math.round(avgPct) + '% received</span></div></div>';

				// Items table
				h += '<table style="width:100%;border-collapse:collapse;font-size:11px;">';
				h += '<thead><tr>';
				h += '<th style="text-align:left;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Item</th>';
				h += '<th style="text-align:right;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">PO Qty</th>';
				h += '<th style="text-align:right;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Received</th>';
				h += '<th style="text-align:right;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Pending</th>';
				h += '<th style="text-align:right;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Rate</th>';
				h += '<th style="text-align:right;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Amount</th>';
				h += '<th style="width:100px;padding:8px 12px;font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;border-bottom:1px solid #f1f5f9;">Receipt %</th>';
				h += '</tr></thead><tbody>';

				po.items.forEach(function (row) {
					var pct = row.receipt_pct || 0;
					var pctColor = pct >= 100 ? '#10b981' : pct > 0 ? '#f59e0b' : '#94a3b8';

					h += '<tr onmouseenter="this.style.background=\'#f8fafc\'" onmouseleave="this.style.background=\'transparent\'">';
					h += '<td style="padding:8px 12px;font-weight:700;color:#1e293b;border-top:1px solid #f8fafc;">' + (row.item_code || '') + '</td>';
					h += '<td style="padding:8px 12px;text-align:right;color:#1e293b;border-top:1px solid #f8fafc;">' + frappe.utils.fmt_money(row.po_qty || 0) + '</td>';
					h += '<td style="padding:8px 12px;text-align:right;font-weight:700;color:#10b981;border-top:1px solid #f8fafc;">' + frappe.utils.fmt_money(row.received_qty || 0) + '</td>';
					h += '<td style="padding:8px 12px;text-align:right;font-weight:700;color:#f59e0b;border-top:1px solid #f8fafc;">' + frappe.utils.fmt_money(row.pending_qty || 0) + '</td>';
					h += '<td style="padding:8px 12px;text-align:right;color:#64748b;border-top:1px solid #f8fafc;">' + frappe.utils.fmt_money(row.rate || 0) + '</td>';
					h += '<td style="padding:8px 12px;text-align:right;font-weight:700;color:#1e293b;border-top:1px solid #f8fafc;">' + frappe.utils.fmt_money(row.po_amount || 0) + '</td>';
					h += '<td style="padding:8px 12px;border-top:1px solid #f8fafc;"><div style="display:flex;align-items:center;gap:4px;"><div style="flex:1;height:4px;background:#f1f5f9;border-radius:2px;overflow:hidden;"><div style="height:100%;width:' + Math.min(pct, 100) + '%;background:' + pctColor + ';border-radius:2px;"></div></div><span style="font-size:8px;font-weight:700;color:' + pctColor + ';">' + Math.round(pct) + '%</span></div></td>';
					h += '</tr>';
				});
				h += '</tbody></table></div>';
			});
		} else {
			h += '<div style="text-align:center;padding:40px;color:#94a3b8;">No procurement data found</div>';
		}

		h += '</div>';
		frappe.query_report.page.main.find('.result').html(h);
	}
};
