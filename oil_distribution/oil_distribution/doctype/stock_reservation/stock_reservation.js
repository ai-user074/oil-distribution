frappe.ui.form.on('Stock Reservation', {
	refresh(frm) {
		frm.trigger('set_warehouse_queries');
		frm.trigger('fetch_swastik_total');
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

	company(frm) {
		frm.trigger('set_warehouse_queries');
		if (frm.doc.warehouse) {
			frm.set_value('warehouse', '');
		}
		if (frm.doc.reserved_warehouse) {
			frm.set_value('reserved_warehouse', '');
		}
	},

	item(frm) {
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
	},

	fetch_swastik_total(frm) {
		frm.call('get_swastik_total_reserved').then(r => {
			if (r && r.message !== undefined) {
				frm.set_value('total_reserved_for_swastik', r.message);
			}
		});
	},

	set_warehouse_queries(frm) {
		if (!frm.doc.company) return;

		frm.set_query('warehouse', function() {
			return {
				filters: {
					company: frm.doc.company,
					is_group: 0
				}
			};
		});

		frm.set_query('reserved_warehouse', function() {
			return {
				filters: {
					company: frm.doc.company,
					is_group: 0
				}
			};
		});
	}
});
