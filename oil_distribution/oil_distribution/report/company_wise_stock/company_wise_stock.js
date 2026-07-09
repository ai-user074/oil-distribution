frappe.query_reports["Company Wise Stock"] = {
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
			// Group by company
			var companies = {};
			data.forEach(function (row) {
				if (!companies[row.company]) companies[row.company] = { warehouses: {}, total_qty: 0, total_value: 0 };
				companies[row.company].total_qty += (row.qty || 0);
				companies[row.company].total_value += (row.stock_value || 0);
				if (!companies[row.company].warehouses[row.warehouse]) companies[row.company].warehouses[row.warehouse] = [];
				companies[row.company].warehouses[row.warehouse].push(row);
			});

			var coColors = { 'Geeta Enterprise': '#3b82f6', 'Global Export': '#10b981', 'Shubham Enterprise': '#f59e0b' };

			Object.keys(companies).forEach(function (co) {
				var c = companies[co];
				var accent = coColors[co] || '#64748b';
				var whKeys = Object.keys(c.warehouses);

				h += '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:12px;overflow:hidden;border-left:4px solid ' + accent + ';">';
				// Company header
				h += '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #f1f5f9;background:#fafbfc;">';
				h += '<div style="display:flex;align-items:center;gap:8px;">';
				h += '<span style="font-size:12px;font-weight:800;color:' + accent + ';">' + co + '</span>';
				h += '<span style="font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;background:' + accent + '20;color:' + accent + ';">' + whKeys.length + ' warehouses</span>';
				h += '</div>';
				h += '<div style="display:flex;gap:16px;">';
				h += '<div style="text-align:right;"><div style="font-size:8px;font-weight:700;color:#94a3b8;">QTY</div><div style="font-size:14px;font-weight:800;color:' + accent + ';">' + frappe.utils.fmt_money(c.total_qty) + '</div></div>';
				h += '<div style="text-align:right;"><div style="font-size:8px;font-weight:700;color:#94a3b8;">VALUE</div><div style="font-size:14px;font-weight:800;color:' + accent + ';">' + frappe.utils.fmt_money(c.total_value) + '</div></div>';
				h += '</div></div>';

				// Warehouse cards grid
				h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:8px;padding:12px;">';
				whKeys.forEach(function (wh) {
					var items = c.warehouses[wh];
					var whQty = items.reduce(function (s, r) { return s + (r.qty || 0); }, 0);
					var whVal = items.reduce(function (s, r) { return s + (r.stock_value || 0); }, 0);
					var isAvail = wh.indexOf('Available WH') !== -1;
					var isReserved = wh.indexOf('Reserved WH') !== -1;
					var tag = isAvail ? 'Available' : isReserved ? 'Reserved' : 'Other';
					var tagColor = isAvail ? '#10b981' : isReserved ? '#f59e0b' : '#94a3b8';
					var tagBg = isAvail ? '#ecfdf5' : isReserved ? '#fffbeb' : '#f8fafc';

					h += '<div style="border:1px solid #f1f5f9;border-radius:8px;padding:10px;">';
					h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">';
					h += '<div style="display:flex;align-items:center;gap:4px;">';
					h += '<span style="font-size:10px;font-weight:700;color:#1e293b;">' + wh.replace(' - ' + (co === 'Geeta Enterprise' ? 'GE' : co === 'Global Export' ? 'GEX' : 'SHE'), '') + '</span>';
					h += '<span style="font-size:8px;font-weight:700;padding:1px 5px;border-radius:4px;background:' + tagBg + ';color:' + tagColor + ';">' + tag + '</span>';
					h += '</div></div>';

					h += '<div style="display:flex;gap:8px;margin-bottom:6px;padding:4px 6px;background:#f8fafc;border-radius:4px;">';
					h += '<div style="flex:1;"><div style="font-size:7px;font-weight:700;color:#94a3b8;">QTY</div><div style="font-size:11px;font-weight:800;color:' + (whQty < 0 ? '#dc2626' : accent) + ';">' + frappe.utils.fmt_money(whQty) + '</div></div>';
					h += '<div style="flex:1;"><div style="font-size:7px;font-weight:700;color:#94a3b8;">VALUE</div><div style="font-size:11px;font-weight:800;color:' + accent + ';">' + frappe.utils.fmt_money(whVal) + '</div></div>';
					h += '</div>';

					h += '<table style="width:100%;border-collapse:collapse;font-size:10px;">';
					h += '<thead><tr>';
					h += '<th style="text-align:left;padding:2px 4px;font-size:8px;font-weight:700;color:#94a3b8;">Item</th>';
					h += '<th style="text-align:right;padding:2px 4px;font-size:8px;font-weight:700;color:#94a3b8;">Qty</th>';
					h += '<th style="text-align:right;padding:2px 4px;font-size:8px;font-weight:700;color:#94a3b8;">Rate</th>';
					h += '<th style="text-align:right;padding:2px 4px;font-size:8px;font-weight:700;color:#94a3b8;">Value</th>';
					h += '</tr></thead><tbody>';
					items.forEach(function (item) {
						var qc = item.qty < 0 ? '#dc2626' : '#1e293b';
						h += '<tr>';
						h += '<td style="padding:2px 4px;font-weight:700;color:#1e293b;border-top:1px solid #f8fafc;">' + item.item_code + '</td>';
						h += '<td style="padding:2px 4px;text-align:right;font-weight:800;color:' + qc + ';border-top:1px solid #f8fafc;">' + frappe.utils.fmt_money(item.qty) + '</td>';
						h += '<td style="padding:2px 4px;text-align:right;color:#64748b;border-top:1px solid #f8fafc;">' + frappe.utils.fmt_money(item.valuation_rate) + '</td>';
						h += '<td style="padding:2px 4px;text-align:right;font-weight:700;color:' + accent + ';border-top:1px solid #f8fafc;">' + frappe.utils.fmt_money(item.stock_value) + '</td>';
						h += '</tr>';
					});
					h += '</tbody></table></div>';
				});
				h += '</div></div>';
			});
		} else {
			h += '<div style="text-align:center;padding:40px;color:#94a3b8;">No stock data found</div>';
		}

		h += '</div>';
		frappe.query_report.page.main.find('.result').html(h);
	}
};
