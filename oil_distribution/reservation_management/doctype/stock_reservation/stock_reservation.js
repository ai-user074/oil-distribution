frappe.ui.form.on('Stock Reservation', {
	refresh(frm) {
		if (frm.doc.docstatus === 1 && frm.doc.status === 'Reserved') {
			frm.add_custom_button(__('Release Reservation'), function() {
				frappe.confirm(
					__('Are you sure you want to release this reservation?'),
					function() {
						frm.call('release_reservation').then(() => {
							frm.reload_doc();
						});
					}
				);
			}, __('Actions'));
		}
	},

	item: function(frm) {
		if (frm.doc.item) {
			frappe.call({
				method: 'frappe.client.get_value',
				args: {
					doctype: 'Item',
					filters: { name: frm.doc.item },
					fieldname: ['stock_uom']
				},
				callback: function(r) {
					if (r.message) {
						frm.set_value('stock_uom', r.message.stock_uom);
					}
				}
			});
		}
	}
});
