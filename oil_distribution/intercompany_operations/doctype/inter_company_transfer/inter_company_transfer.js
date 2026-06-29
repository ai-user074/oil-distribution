frappe.ui.form.on('Inter Company Transfer', {
	refresh(frm) {
		frm.trigger('set_warehouse_queries');
		if (frm.doc.docstatus === 1 && frm.doc.status === 'Transfer Created') {
			frm.add_custom_button(__('View Generated Documents'), function() {
				frm.trigger('show_generated_documents');
			}, __('Actions'));
		}
	},

	company(frm) {
		frm.trigger('set_warehouse_queries');
		if (frm.doc.items) {
			frm.doc.items.forEach(row => {
				row.source_warehouse = '';
			});
			frm.refresh_field('items');
		}
	},

	to_company(frm) {
		frm.trigger('set_warehouse_queries');
		if (frm.doc.items) {
			frm.doc.items.forEach(row => {
				row.target_warehouse = '';
			});
			frm.refresh_field('items');
		}
	},

	set_warehouse_queries(frm) {
		if (frm.doc.company) {
			frm.set_query('source_warehouse', 'items', function() {
				return {
					filters: {
						company: frm.doc.company,
						is_group: 0
					}
				};
			});
		}
		if (frm.doc.to_company) {
			frm.set_query('target_warehouse', 'items', function() {
				return {
					filters: {
						company: frm.doc.to_company,
						is_group: 0
					}
				};
			});
		}
	},

	show_generated_documents(frm) {
		if (!frm.doc.generated_documents || frm.doc.generated_documents.length === 0) {
			frappe.msgprint(__('No generated documents found'));
			return;
		}

		let html = '<table class="table table-bordered"><thead><tr>';
		html += '<th>#</th><th>Document Type</th><th>Document Name</th><th>Company</th><th>Posting Date</th><th>Grand Total</th><th>Status</th>';
		html += '</tr></thead><tbody>';

		let idx = 1;
		frm.doc.generated_documents.forEach(function(row) {
			let route = '/app/' + row.document_type.toLowerCase().replace(/ /g, '-') + '/' + row.document_name;
			html += '<tr>';
			html += '<td>' + idx + '</td>';
			html += '<td>' + row.document_type + '</td>';
			html += '<td><a href="' + route + '" target="_blank"><b>' + row.document_name + '</b></a></td>';
			html += '<td>' + (row.company || '') + '</td>';
			html += '<td>' + (row.posting_date || '') + '</td>';
			html += '<td>' + format_currency(row.grand_total) + '</td>';
			html += '<td><span class="indicator-pill ' + (row.status === 'Submitted' ? 'green' : row.status === 'Cancelled' ? 'red' : 'orange') + '">' + (row.status || '') + '</span></td>';
			html += '</tr>';
			idx++;
		});

		html += '</tbody></table>';

		frappe.msgprint({
			title: __('Generated Documents ({0})', [frm.doc.generated_documents.length]),
			indicator: 'green',
			message: html
		});
	}
});

frappe.ui.form.on('Inter Company Transfer Item', {
	item_code: function(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		if (row.item_code) {
			frappe.call({
				method: 'frappe.client.get_value',
				args: {
					doctype: 'Item',
					filters: { name: row.item_code },
					fieldname: ['stock_uom', 'item_name']
				},
				callback: function(r) {
					if (r.message) {
						frappe.model.set_value(cdt, cdn, 'stock_uom', r.message.stock_uom);
						frappe.model.set_value(cdt, cdn, 'item_name', r.message.item_name);
						if (!row.uom) {
							frappe.model.set_value(cdt, cdn, 'uom', r.message.stock_uom);
						}
					}
				}
			});
		}
	},

	qty: function(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		frappe.model.set_value(cdt, cdn, 'amount', (row.qty || 0) * (row.rate || 0));
	},

	rate: function(frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		frappe.model.set_value(cdt, cdn, 'amount', (row.qty || 0) * (row.rate || 0));
	}
});
