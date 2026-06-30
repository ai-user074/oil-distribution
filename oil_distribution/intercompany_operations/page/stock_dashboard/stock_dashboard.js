frappe.pages['stock-dashboard'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Stock Dashboard',
		single_column: true
	});

	page.stock_dashboard = new StockDashboard(page);
};

class StockDashboard {
	constructor(page) {
		this.page = page;
		this.wrapper = page.main;
		this.render();
	}

	render() {
		this.wrapper.html(`
			<div class="frappe-card mb-3">
				<div class="card-body">
					<div class="row align-items-end">
						<div class="col-md-3">
							<label class="text-muted small">View</label>
							<select class="form-control form-control-sm" id="stock-view-type">
								<option value="company">By Company & Warehouse</option>
								<option value="item">By Item</option>
							</select>
						</div>
						<div class="col-md-2">
							<button class="btn btn-primary btn-sm" id="refresh-stock">
								<i class="fa fa-refresh"></i> Refresh
							</button>
						</div>
					</div>
				</div>
			</div>
			<div id="swastik-reserved-card" class="row mb-3"></div>
			<div id="stock-summary-cards" class="row mb-3"></div>
			<div id="stock-dashboard-content"></div>
		`);

		this.load_swastik_card();
		this.load_company_view();

		$('#stock-view-type').on('change', () => {
			if ($('#stock-view-type').val() === 'company') {
				this.load_company_view();
			} else {
				this.load_item_view();
			}
		});

		$('#refresh-stock').on('click', () => {
			this.load_swastik_card();
			if ($('#stock-view-type').val() === 'company') {
				this.load_company_view();
			} else {
				this.load_item_view();
			}
		});
	}

	load_swastik_card() {
		frappe.call({
			method: 'oil_distribution.intercompany_operations.page.stock_dashboard.stock_dashboard.get_swastik_total',
			callback: (r) => {
				if (r.message) {
					this.render_swastik_card(r.message);
				}
			}
		});
	}

	render_swastik_card(data) {
		let company_badges = '';
		if (data.by_company && data.by_company.length) {
			company_badges = data.by_company.map(c =>
				`<span class="badge badge-secondary ml-1">${c.company}: ${format_number(c.total_reserved)}</span>`
			).join('');
		}

		let item_badges = '';
		if (data.by_item && data.by_item.length) {
			item_badges = data.by_item.map(i =>
				`<span class="badge badge-light ml-1">${i.item}: ${format_number(i.total_reserved)}</span>`
			).join('');
		}

		let detail_rows = '';
		if (data.detail && data.detail.length) {
			detail_rows = data.detail.map(d =>
				`<tr><td>${d.company}</td><td>${d.item_code}</td><td style="font-size:11px">${d.warehouse}</td><td class="text-right"><strong>${format_number(d.qty)}</strong></td></tr>`
			).join('');
		}

		$('#swastik-reserved-card').html(`
			<div class="col-md-12">
				<div class="frappe-card" style="border-left: 4px solid var(--primary);">
					<div class="card-body">
						<div class="row">
							<div class="col-md-3 text-center">
								<div class="text-muted mb-1" style="font-size: 12px;">Reserved for Swastik (Total)</div>
								<h2 class="mt-0 mb-0" style="color: var(--primary);">${format_number(data.total_reserved)}</h2>
								<div class="text-muted" style="font-size: 11px;">All Reserved Warehouses</div>
							</div>
							<div class="col-md-3 text-center">
								<div class="text-muted mb-1" style="font-size: 12px;">Companies</div>
								<h3 class="mt-0 mb-0">${data.companies_count}</h3>
							</div>
							<div class="col-md-3 text-center">
								<div class="text-muted mb-1" style="font-size: 12px;">Items Reserved</div>
								<h3 class="mt-0 mb-0">${data.items_count}</h3>
							</div>
							<div class="col-md-3">
								<div class="text-muted mb-1" style="font-size: 12px;">By Company</div>
								<div>${company_badges || '<span class="text-muted">None</span>'}</div>
								<div class="mt-1" style="font-size: 11px;"><strong>By Item:</strong> ${item_badges || '<span class="text-muted">None</span>'}</div>
							</div>
						</div>
						${detail_rows ? `
						<div class="mt-3">
							<table class="table table-bordered table-sm mb-0" style="font-size: 12px;">
								<thead class="thead-light"><tr>
									<th>Company</th><th>Item</th><th>Warehouse</th><th class="text-right">Qty</th>
								</tr></thead>
								<tbody>${detail_rows}</tbody>
							</table>
						</div>` : ''}
					</div>
				</div>
			</div>
		`);
	}

	load_company_view() {
		frappe.call({
			method: 'oil_distribution.intercompany_operations.page.stock_dashboard.stock_dashboard.get_stock_summary',
			callback: (r) => {
				if (r.message) {
					this.render_company_view(r.message);
				}
			}
		});
	}

	load_item_view() {
		frappe.call({
			method: 'oil_distribution.intercompany_operations.page.stock_dashboard.stock_dashboard.get_item_wise_summary',
			callback: (r) => {
				if (r.message) {
					this.render_item_view(r.message);
				}
			}
		});
	}

	render_company_view(data) {
		let total_stock = 0;
		let total_value = 0;
		let negative_count = 0;
		data.forEach(c => {
			total_stock += c.total_qty;
			total_value += c.total_value;
			c.warehouses.forEach(w => {
				w.items.forEach(i => {
					if (i.is_negative) negative_count++;
				});
			});
		});

		$('#stock-summary-cards').html(`
			<div class="col-md-3">
				<div class="frappe-card">
					<div class="card-body text-center">
						<div class="text-muted mb-1">Companies</div>
						<h3 class="mt-0 mb-0">${data.length}</h3>
					</div>
				</div>
			</div>
			<div class="col-md-3">
				<div class="frappe-card">
					<div class="card-body text-center">
						<div class="text-muted mb-1">Total Stock Qty</div>
						<h3 class="mt-0 mb-0">${format_number(total_stock)}</h3>
					</div>
				</div>
			</div>
			<div class="col-md-3">
				<div class="frappe-card">
					<div class="card-body text-center">
						<div class="text-muted mb-1">Total Stock Value</div>
						<h3 class="mt-0 mb-0">${format_currency(total_value)}</h3>
					</div>
				</div>
			</div>
			<div class="col-md-3">
				<div class="frappe-card">
					<div class="card-body text-center">
						<div class="text-muted mb-1">Negative Stock Items</div>
						<h3 class="mt-0 mb-0 ${negative_count > 0 ? 'text-danger' : ''}">${negative_count}</h3>
					</div>
				</div>
			</div>
		`);

		let html = '';
		data.forEach(company => {
			let border_class = company.total_qty < 0 ? 'border-danger' : '';
			html += `<div class="frappe-card mb-3 ${border_class}">
				<div class="card-header d-flex justify-content-between align-items-center">
					<div>
						<strong>${company.company}</strong>
						<span class="text-muted ml-2">(${company.abbr})</span>
					</div>
					<div>
						<span class="indicator-pill whitespace-nowrap ${company.total_qty >= 0 ? 'green' : 'red'}">
							Qty: ${format_number(company.total_qty)}
						</span>
						<span class="indicator-pill whitespace-nowrap blue ml-1">
							Value: ${format_currency(company.total_value)}
						</span>
					</div>
				</div>
				<div class="card-body p-0">`;

			company.warehouses.forEach(wh => {
				let wh_indicator = wh.total_qty < 0 ? 'orange' : 'green';
				html += `<div class="p-3 border-bottom">
					<div class="d-flex justify-content-between align-items-center mb-2">
						<strong>${wh.warehouse_name}</strong>
						<span class="text-muted small">Qty: ${format_number(wh.total_qty)} | Value: ${format_currency(wh.total_value)}</span>
					</div>
					<div class="row">`;

				wh.items.forEach(item => {
					let qty_class = item.is_negative ? 'text-danger' : 'text-dark';
					let badge = item.is_negative ? 'red' : 'green';
					html += `<div class="col-md-3 col-sm-4 mb-2">
						<div class="p-2 border rounded">
							<div class="text-muted" style="font-size: 12px;">${item.item_code}</div>
							<div class="${qty_class}" style="font-size: 16px; font-weight: 600;">${format_number(item.qty)}</div>
							<div class="text-muted" style="font-size: 11px;">${format_currency(item.stock_value)}</div>
						</div>
					</div>`;
				});

				html += `</div></div>`;
			});

			if (company.warehouses.length === 0) {
				html += '<div class="card-body text-muted text-center py-4">No stock data</div>';
			}

			html += `</div></div>`;
		});

		$('#stock-dashboard-content').html(html);
	}

	render_item_view(data) {
		let total_items = data.length;
		let total_qty = data.reduce((a, b) => a + b.total_qty, 0);
		let total_value = data.reduce((a, b) => a + b.total_value, 0);

		$('#stock-summary-cards').html(`
			<div class="col-md-4">
				<div class="frappe-card">
					<div class="card-body text-center">
						<div class="text-muted mb-1">Total Items</div>
						<h3 class="mt-0 mb-0">${total_items}</h3>
					</div>
				</div>
			</div>
			<div class="col-md-4">
				<div class="frappe-card">
					<div class="card-body text-center">
						<div class="text-muted mb-1">Total Qty</div>
						<h3 class="mt-0 mb-0">${format_number(total_qty)}</h3>
					</div>
				</div>
			</div>
			<div class="col-md-4">
				<div class="frappe-card">
					<div class="card-body text-center">
						<div class="text-muted mb-1">Total Value</div>
						<h3 class="mt-0 mb-0">${format_currency(total_value)}</h3>
					</div>
				</div>
			</div>
		`);

		let html = '<div class="frappe-card"><div class="card-body p-0"><table class="table table-bordered table-hover mb-0" style="font-size: 13px;">';
		html += '<thead class="thead-light"><tr>';
		html += '<th>Item</th>';
		data[0] && Object.keys(data[0].companies).forEach(co => {
			html += `<th colspan="2" class="text-center">${co}</th>`;
		});
		html += '<th colspan="2" class="text-center" style="background: var(--subtle-fg);">Total</th>';
		html += '</tr><tr><th></th>';
		data[0] && Object.keys(data[0].companies).forEach(() => {
			html += '<th class="text-right">Qty</th><th class="text-right">Value</th>';
		});
		html += '<th class="text-right" style="background: var(--subtle-fg);">Qty</th><th class="text-right" style="background: var(--subtle-fg);">Value</th>';
		html += '</tr></thead><tbody>';

		data.forEach(item => {
			html += '<tr>';
			html += `<td><strong>${item.item_code}</strong></td>`;
			let companies = item.companies;
			let all_companies = data[0] ? Object.keys(data[0].companies) : [];
			all_companies.forEach(co => {
				if (companies[co]) {
					let qty = companies[co].qty;
					let color = qty < 0 ? 'color: var(--text-color-danger); font-weight: bold;' : '';
					html += `<td class="text-right" style="${color}">${format_number(qty)}</td>`;
					html += `<td class="text-right">${format_currency(companies[co].value)}</td>`;
				} else {
					html += '<td class="text-right">0</td><td class="text-right">0.00</td>';
				}
			});
			let qty_color = item.total_qty < 0 ? 'color: var(--text-color-danger); font-weight: bold;' : '';
			html += `<td class="text-right" style="background: var(--subtle-fg); ${qty_color}">${format_number(item.total_qty)}</td>`;
			html += `<td class="text-right" style="background: var(--subtle-fg);">${format_currency(item.total_value)}</td>`;
			html += '</tr>';
		});

		html += '</tbody></table></div></div>';
		$('#stock-dashboard-content').html(html);
	}
}
