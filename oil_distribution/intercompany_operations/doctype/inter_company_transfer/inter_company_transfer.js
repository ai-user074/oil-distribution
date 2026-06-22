frappe.ui.form.on('Inter Company Transfer', {
	refresh(frm) {
		if (frm.doc.docstatus === 1 && frm.doc.status === 'Transfer Created') {
			frm.add_custom_button(__('View Generated Documents'), function() {
				frm.trigger('show_generated_documents');
			}, __('Actions'));
		}
	},

	show_generated_documents(frm) {
		if (!frm.doc.generated_documents || frm.doc.generated_documents.length === 0) {
			frappe.msgprint(__('No generated documents found'));
			return;
		}

		let html = '<table class="table table-bordered"><thead><tr>';
		html += '<th>Document Type</th><th>Document Name</th><th>Company</th><th>Status</th>';
		html += '</tr></thead><tbody>';

		frm.doc.generated_documents.forEach(function(row) {
			html += '<tr>';
			html += `<td>${row.document_type}</td>`;
			html += `<td><a href="/app/${row.document_type.toLowerCase().replace(/ /g, '-')}/${row.document_name}">${row.document_name}</a></td>`;
			html += `<td>${row.company || ''}</td>`;
			html += `<td>${row.status === 1 ? 'Submitted' : row.status === 0 ? 'Draft' : 'Cancelled'}</td>`;
			html += '</tr>';
		});

		html += '</tbody></table>';

		frappe.msgprint({
			title: __('Generated Documents'),
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
