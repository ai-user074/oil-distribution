<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Stock Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="sd">
        <div class="top-bars">
          <div class="sd-bar sd-anim">
            <label>Company</label>
            <div class="sd-ms" ref="companyMsContainer">
              <div class="sd-ms-btn" :class="{ 'sd-ms-open': companyMsOpen }" ref="companyMsBtn" @click.stop="toggleCompanyMs" v-html="companyBtnLabel"></div>
              <Teleport to="body">
                <div class="sd-ms-panel" :class="{ 'sd-ms-show': companyMsOpen }" ref="companyMsPanel" :style="companyPanelStyle">
                  <input class="sd-ms-search" type="text" placeholder="Search..." v-model="companySearch">
                  <div class="sd-ms-actions">
                    <button class="sd-ms-action" @click.prevent.stop="selectAllCompany">Select All</button>
                    <button class="sd-ms-action" @click.prevent.stop="clearCompany">Clear</button>
                  </div>
                  <div v-if="companyErr" style="display:block;text-align:center;padding:8px;color:#dc2626;font-size:10px;font-weight:600;">Select at least one element</div>
                  <label v-for="opt in filteredCompanyOptions" :key="opt.value" class="sd-ms-opt">
                    <input type="checkbox" :value="opt.value" v-model="companySelected" @change="onCompanyChange">
                    <span class="sd-ms-opt-label">{{ opt.label }}</span>
                    <span v-if="opt.abbr" class="sd-ms-opt-abbr">{{ opt.abbr }}</span>
                  </label>
                  <div v-if="!companyOptions.length" style="text-align:center;padding:12px;color:#94a3b8;font-size:10px;">Loading...</div>
                </div>
              </Teleport>
            </div>
            <label style="margin-left:8px;">Item</label>
            <div class="sd-ms" style="min-width:200px;" ref="itemMsContainer">
              <div class="sd-ms-btn" :class="{ 'sd-ms-open': itemMsOpen }" ref="itemMsBtn" @click.stop="toggleItemMs" v-html="itemBtnLabel"></div>
              <Teleport to="body">
                <div class="sd-ms-panel" :class="{ 'sd-ms-show': itemMsOpen }" ref="itemMsPanel" :style="itemPanelStyle">
                  <input class="sd-ms-search" type="text" placeholder="Search..." v-model="itemSearch">
                  <div class="sd-ms-actions">
                    <button class="sd-ms-action" @click.prevent.stop="selectAllItem">Select All</button>
                    <button class="sd-ms-action" @click.prevent.stop="clearItem">Clear</button>
                  </div>
                  <div v-if="itemErr" style="display:block;text-align:center;padding:8px;color:#dc2626;font-size:10px;font-weight:600;">Select at least one element</div>
                  <label v-for="opt in filteredItemOptions" :key="opt.value" class="sd-ms-opt">
                    <input type="checkbox" :value="opt.value" v-model="itemSelected" @change="onItemChange">
                    <span class="sd-ms-opt-label">{{ opt.label }}</span>
                  </label>
                  <div v-if="!itemOptions.length" style="text-align:center;padding:12px;color:#94a3b8;font-size:10px;">Loading...</div>
                </div>
              </Teleport>
            </div>
            <div style="margin-left:auto;display:flex;gap:6px;flex-shrink:0;">
              <span class="sd-filter-tag" :style="filterTagStyle">{{ filterTagLabel }}</span>
            </div>
          </div>
          <div class="sd-tabs sd-anim" style="animation-delay:0.04s">
            <button class="sd-tab-btn" :class="{ 'sd-tab-active': activeTab === 'overview' }" @click="activeTab = 'overview'">Overview</button>
            <button class="sd-tab-btn" :class="{ 'sd-tab-active': activeTab === 'company' }" @click="activeTab = 'company'">By Company</button>
            <button class="sd-tab-btn" :class="{ 'sd-tab-active': activeTab === 'item' }" @click="activeTab = 'item'">By Item</button>
            <button class="sd-tab-btn" :class="{ 'sd-tab-active': activeTab === 'swastik' }" @click="activeTab = 'swastik'">Swastik Reserved</button>
          </div>
        </div>

        <!-- OVERVIEW -->
        <div v-show="activeTab === 'overview'">
          <div class="sd-kpi-row sd-anim" style="animation-delay:0.06s">
            <div v-for="(k, i) in kpiCards" :key="i" class="sd-kpi" @click="k.routeFn && k.routeFn()">
              <div class="sd-kpi-icon" :style="{ background: k.bg, color: k.color }">{{ k.icon }}</div>
              <div>
                <div class="sd-kpi-val" :style="{ color: k.color }">{{ k.displayVal }}</div>
                <div class="sd-kpi-lbl">{{ k.lbl }}</div>
              </div>
            </div>
          </div>
          <div class="sd-anim" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;animation-delay:0.1s">
            <div class="sd-card" style="margin-bottom:0;">
              <div class="sd-card-head">
                <div class="sd-card-icon" style="background:#dbeafe;color:#3b82f6;">📊</div>
                <div><div class="sd-card-title">Stock by Company</div><div class="sd-card-sub">Available vs Reserved</div></div>
              </div>
              <div ref="chartCompanyEl" style="display:flex;justify-content:center;"></div>
            </div>
            <div class="sd-card" style="margin-bottom:0;">
              <div class="sd-card-head">
                <div class="sd-card-icon" style="background:#ede9fe;color:#7c3aed;">📦</div>
                <div><div class="sd-card-title">Utilization</div><div class="sd-card-sub">Reserved / Total Stock</div></div>
              </div>
              <div ref="chartWhEl" style="display:flex;justify-content:center;"></div>
            </div>
            <div class="sd-card" style="margin-bottom:0;">
              <div class="sd-card-head">
                <div class="sd-card-icon" style="background:#fef3c7;color:#d97706;">⚡</div>
                <div><div class="sd-card-title">Quick Stats</div><div class="sd-card-sub">At a glance</div></div>
              </div>
              <div v-if="kpiData" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div v-for="q in quickStatsItems" :key="q.lbl" :style="{ padding: '6px 8px', background: q.bg, borderRadius: '6px' }">
                  <div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">{{ q.lbl }}</div>
                  <div :style="{ fontSize: '13px', fontWeight: 800, color: q.color }">{{ q.val }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="sd-anim" style="animation-delay:0.14s;margin-bottom:14px;">
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
              <div v-for="(d, i) in companyDetailCards" :key="i" class="sd-card" :style="{ borderLeft: '3px solid ' + d.accent, padding: '14px', marginBottom: 0 }">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                  <div :style="{ width: '30px', height: '30px', borderRadius: '8px', background: d.bg, color: d.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }">{{ d.abbr }}</div>
                  <div>
                    <div style="font-size:11px;font-weight:700;color:#1e293b;">{{ d.company }}</div>
                    <div style="font-size:8px;color:#94a3b8;">{{ d.item_count }} items</div>
                  </div>
                </div>
                <div style="height:4px;background:#f1f5f9;border-radius:2px;overflow:hidden;margin-bottom:4px;">
                  <div :style="{ height: '100%', width: d.availPct + '%', background: 'linear-gradient(90deg,#3b82f6,#7c3aed)', borderRadius: '2px' }"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                  <span style="font-size:8px;color:#94a3b8;">{{ d.availPct }}% avail</span>
                  <span :style="{ fontSize: '9px', fontWeight: 700, color: d.accent }">{{ sd_k(d.total_value) }}</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                  <div style="padding:6px;background:#eff6ff;border-radius:6px;text-align:center;">
                    <div style="font-size:7px;font-weight:700;color:#94a3b8;">AVAILABLE</div>
                    <div style="font-size:13px;font-weight:800;color:#3b82f6;">{{ sd_n(d.avail_qty) }}</div>
                  </div>
                  <div style="padding:6px;background:#fffbeb;border-radius:6px;text-align:center;">
                    <div style="font-size:7px;font-weight:700;color:#94a3b8;">RESERVED</div>
                    <div style="font-size:13px;font-weight:800;color:#f59e0b;">{{ sd_n(d.reserved_qty) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="sd-card sd-anim" style="animation-delay:0.18s">
            <div class="sd-card-head">
              <div class="sd-card-icon" style="background:#fef2f2;color:#dc2626;">⚠</div>
              <div style="flex:1;"><div class="sd-card-title">Negative Stock Alerts</div><div class="sd-card-sub">Requires attention</div></div>
              <a class="sd-link" style="color:#dc2626;cursor:pointer;" @click.prevent="frappe.set_route('List','Bin',{actual_qty:['<',0]})">View All →</a>
            </div>
            <div v-if="negativeData.length" style="display:flex;gap:10px;margin-bottom:10px;">
              <div style="flex:1;padding:8px 10px;background:#fef2f2;border-radius:8px;border-left:3px solid #dc2626;">
                <div style="font-size:8px;font-weight:700;color:#94a3b8;">ALERTS</div>
                <div style="font-size:18px;font-weight:800;color:#dc2626;">{{ negativeData.length }}</div>
              </div>
              <div style="flex:1;padding:8px 10px;background:#fef2f2;border-radius:8px;border-left:3px solid #dc2626;">
                <div style="font-size:8px;font-weight:700;color:#94a3b8;">NEGATIVE VALUE</div>
                <div style="font-size:18px;font-weight:800;color:#dc2626;">{{ sd_k(negTotalVal) }}</div>
              </div>
            </div>
            <template v-for="(rows, co) in negByCompany" :key="co">
              <div style="border:1px solid #fecaca;border-radius:8px;padding:10px;margin-bottom:8px;background:#fffafa;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                  <div style="font-size:10px;font-weight:700;color:#dc2626;">{{ co }}</div>
                  <span style="font-size:8px;font-weight:700;padding:2px 6px;border-radius:4px;background:#fef2f2;color:#dc2626;">{{ rows.length }} alerts</span>
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:10px;">
                  <thead><tr>
                    <th style="text-align:left;padding:3px 4px;font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Warehouse</th>
                    <th style="text-align:left;padding:3px 4px;font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Item</th>
                    <th style="text-align:right;padding:3px 4px;font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Qty</th>
                    <th style="text-align:right;padding:3px 4px;font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Value</th>
                  </tr></thead>
                  <tbody>
                    <tr v-for="(row, ri) in rows" :key="ri" style="cursor:pointer;" @click="frappe.set_route('Form','Bin',row.warehouse + '/' + row.item_code)">
                      <td style="padding:3px 4px;color:#64748b;border-top:1px solid #fef2f2;">{{ row.warehouse.replace(' - ' + companySuffix(co), '') }}</td>
                      <td style="padding:3px 4px;font-weight:700;color:#1e293b;border-top:1px solid #fef2f2;">{{ row.item_code }}</td>
                      <td style="padding:3px 4px;text-align:right;font-weight:800;color:#dc2626;border-top:1px solid #fef2f2;">{{ sd_n(row.actual_qty) }}</td>
                      <td style="padding:3px 4px;text-align:right;font-weight:700;color:#dc2626;border-top:1px solid #fef2f2;">{{ sd_k(row.stock_value) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
            <div v-if="!negativeData.length && kpiData" style="text-align:center;padding:20px;color:#059669;font-weight:600;">✓ All clear — no negative stock</div>
          </div>
        </div>

        <!-- BY COMPANY -->
        <div v-show="activeTab === 'company'">
          <div v-for="(c, coName) in whByCompany" :key="coName" :style="{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', marginBottom: '14px', borderLeft: '4px solid ' + companyColor(coName).accent }">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <div :style="{ width: '36px', height: '36px', borderRadius: '10px', background: companyColor(coName).bg, color: companyColor(coName).accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800 }">{{ companyColor(coName).abbr }}</div>
                <div>
                  <div :style="{ fontSize: '14px', fontWeight: 800, color: companyColor(coName).accent }">{{ coName }}</div>
                  <div style="font-size:9px;color:#94a3b8;">{{ c.warehouses.length }} warehouses · {{ c.total_items }} items</div>
                </div>
              </div>
              <div style="display:flex;gap:16px;">
                <div style="text-align:right;">
                  <div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Qty</div>
                  <div :style="{ fontSize: '16px', fontWeight: 800, color: companyColor(coName).accent }">{{ sd_n(c.total_qty) }} L</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Value</div>
                  <div :style="{ fontSize: '16px', fontWeight: 800, color: companyColor(coName).accent }">{{ sd_k(c.total_value) }}</div>
                </div>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:10px;">
              <div v-for="(wh, wi) in c.warehouses" :key="wi" style="border:1px solid #f1f5f9;border-radius:10px;padding:12px;transition:all 0.15s;" @mouseenter="$event.currentTarget.style.borderColor='#e2e8f0'" @mouseleave="$event.currentTarget.style.borderColor='#f1f5f9'">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:10px;font-weight:700;color:#1e293b;">{{ wh.warehouse.replace(' - ' + companyColor(coName).abbr, '') }}</span>
                    <span :style="{ fontSize: '8px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', background: whTagBg(wh), color: whTagColor(wh) }">{{ whTag(wh) }}</span>
                  </div>
                  <div style="font-size:9px;color:#94a3b8;">{{ wh.item_count }} items</div>
                </div>
                <div style="display:flex;gap:12px;margin-bottom:8px;padding:6px 8px;background:#f8fafc;border-radius:6px;">
                  <div style="flex:1;"><div style="font-size:8px;font-weight:700;color:#94a3b8;">QTY</div><div :style="{ fontSize: '12px', fontWeight: 800, color: wh.total_qty < 0 ? '#dc2626' : companyColor(coName).accent }">{{ sd_n(wh.total_qty) }}</div></div>
                  <div style="flex:1;"><div style="font-size:8px;font-weight:700;color:#94a3b8;">VALUE</div><div :style="{ fontSize: '12px', fontWeight: 800, color: companyColor(coName).accent }">{{ sd_k(wh.total_value) }}</div></div>
                </div>
                <table v-if="wh.items && wh.items.length" style="width:100%;border-collapse:collapse;font-size:10px;">
                  <thead><tr>
                    <th style="text-align:left;padding:3px 4px;font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Item</th>
                    <th style="text-align:right;padding:3px 4px;font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Qty</th>
                    <th style="text-align:right;padding:3px 4px;font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Rate</th>
                    <th style="text-align:right;padding:3px 4px;font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;">Value</th>
                  </tr></thead>
                  <tbody>
                    <tr v-for="(item, ii) in wh.items" :key="ii">
                      <td style="padding:3px 4px;font-weight:700;color:#1e293b;border-top:1px solid #f8fafc;">{{ item.item_code }}</td>
                      <td :style="{ padding: '3px 4px', textAlign: 'right', fontWeight: 800, color: item.qty < 0 ? '#dc2626' : '#1e293b', borderTop: '1px solid #f8fafc' }">{{ sd_n(item.qty) }}</td>
                      <td style="padding:3px 4px;text-align:right;color:#64748b;border-top:1px solid #f8fafc;">{{ sd_k(item.rate) }}</td>
                      <td :style="{ padding: '3px 4px', textAlign: 'right', fontWeight: 700, color: companyColor(coName).accent, borderTop: '1px solid #f8fafc' }">{{ sd_k(item.value) }}</td>
                    </tr>
                  </tbody>
                </table>
                <div v-else style="text-align:center;padding:8px;color:#e2e8f0;font-size:9px;">No items</div>
              </div>
            </div>
          </div>
          <div v-if="!Object.keys(whByCompany).length && kpiData" style="text-align:center;padding:30px;color:#94a3b8;">No warehouse data</div>
        </div>

        <!-- BY ITEM -->
        <div v-show="activeTab === 'item'">
          <div class="sd-card sd-anim">
            <div class="sd-card-head">
              <div class="sd-card-icon" style="background:#ede9fe;color:#7c3aed;">📋</div>
              <div><div class="sd-card-title">Item-wise Stock Summary</div><div class="sd-card-sub">All items across companies</div></div>
            </div>
            <div v-if="itemData.length">
              <table class="sd-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th v-for="co in itemTableCos" :key="co" colspan="2" style="text-align:center;">{{ co.replace(' Enterprise', '').replace(' Export', '') }}</th>
                    <th colspan="2" style="text-align:center;background:#eff6ff;">Total</th>
                  </tr>
                  <tr>
                    <th></th>
                    <template v-for="co in itemTableCos" :key="'sub-'+co">
                      <th style="text-align:right;">Qty</th>
                      <th style="text-align:right;">Value</th>
                    </template>
                    <th style="text-align:right;background:#eff6ff;">Qty</th>
                    <th style="text-align:right;background:#eff6ff;">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in itemData" :key="idx">
                    <td style="font-weight:700;color:#1e293b;">{{ item.item_code }}</td>
                    <template v-for="co in itemTableCos" :key="'td-'+co+idx">
                      <td v-if="item.companies[co]" :style="{ textAlign: 'right', color: item.companies[co].qty < 0 ? '#dc2626' : undefined, fontWeight: item.companies[co].qty < 0 ? 800 : undefined }">{{ sd_n(item.companies[co].qty) }}</td>
                      <td v-else style="text-align:right;color:#e2e8f0;">-</td>
                      <td v-if="item.companies[co]" style="text-align:right;">{{ sd_k(item.companies[co].value) }}</td>
                      <td v-else style="text-align:right;color:#e2e8f0;">-</td>
                    </template>
                    <td :style="{ textAlign: 'right', background: '#f8fafc', color: item.total_qty < 0 ? '#dc2626' : undefined, fontWeight: item.total_qty < 0 ? 800 : undefined }">{{ sd_n(item.total_qty) }}</td>
                    <td style="text-align:right;background:#f8fafc;font-weight:700;">{{ sd_k(item.total_value) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else-if="kpiData" style="text-align:center;padding:30px;color:#94a3b8;">No item data</div>
          </div>
        </div>

        <!-- SWASTIK RESERVED -->
        <div v-show="activeTab === 'swastik'">
          <div class="sd-kpi-row sd-anim" style="animation-delay:0.06s;grid-template-columns:repeat(4,1fr);">
            <div v-for="(k, i) in swastikKpis" :key="i" class="sd-kpi">
              <div class="sd-kpi-icon" :style="{ background: k.bg, color: k.color }">{{ k.icon }}</div>
              <div>
                <div class="sd-kpi-val" :style="{ color: k.color }">{{ k.val }}</div>
                <div class="sd-kpi-lbl">{{ k.lbl }}</div>
              </div>
            </div>
          </div>
          <div class="sd-grid-5-5 sd-anim" style="animation-delay:0.1s">
            <div class="sd-card" style="margin-bottom:0;">
              <div class="sd-card-head">
                <div class="sd-card-icon" style="background:#fef3c7;color:#d97706;">🛡</div>
                <div><div class="sd-card-title">Reserved by Company</div></div>
              </div>
              <div v-if="swastikData && swastikData.by_company && swastikData.by_company.length">
                <table class="sd-table">
                  <thead><tr>
                    <th>Company</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Value</th><th style="width:160px;">Share (of {{ sd_n(swastikData.total_qty) }} L)</th>
                  </tr></thead>
                  <tbody>
                    <tr v-for="(row, i) in swastikData.by_company" :key="i">
                      <td style="font-weight:700;color:#1e293b;">{{ row.company }}</td>
                      <td style="text-align:right;font-weight:800;color:#d97706;">{{ sd_n(row.qty) }} L</td>
                      <td style="text-align:right;font-weight:700;color:#059669;">{{ sd_k(row.val) }}</td>
                      <td>
                        <div style="display:flex;align-items:center;gap:6px;">
                          <div class="sd-prog" style="flex:1;"><div class="sd-prog-fill" :style="{ width: (swastikData.total_qty > 0 ? row.qty / swastikData.total_qty * 100 : 0) + '%', background: 'linear-gradient(90deg,#f59e0b,#fbbf24)' }"></div></div>
                          <span style="font-size:9px;font-weight:700;color:#d97706;min-width:36px;text-align:right;">{{ (swastikData.total_qty > 0 ? row.qty / swastikData.total_qty * 100 : 0).toFixed(1) }}%</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="sd-card" style="margin-bottom:0;">
              <div class="sd-card-head">
                <div class="sd-card-icon" style="background:#ede9fe;color:#7c3aed;">📦</div>
                <div><div class="sd-card-title">Reserved by Item</div></div>
              </div>
              <div v-if="swastikData && swastikData.by_item && swastikData.by_item.length">
                <table class="sd-table">
                  <thead><tr>
                    <th>Item</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Value</th><th style="width:160px;">Share (of {{ sd_n(swastikData.total_qty) }} L)</th>
                  </tr></thead>
                  <tbody>
                    <tr v-for="(row, i) in swastikData.by_item" :key="i">
                      <td style="font-weight:700;color:#1e293b;">{{ row.item_code }}</td>
                      <td style="text-align:right;font-weight:800;color:#d97706;">{{ sd_n(row.qty) }} L</td>
                      <td style="text-align:right;font-weight:700;color:#059669;">{{ sd_k(row.val) }}</td>
                      <td>
                        <div style="display:flex;align-items:center;gap:6px;">
                          <div class="sd-prog" style="flex:1;"><div class="sd-prog-fill" :style="{ width: (swastikData.total_qty > 0 ? row.qty / swastikData.total_qty * 100 : 0) + '%', background: 'linear-gradient(90deg,#7c3aed,#a78bfa)' }"></div></div>
                          <span style="font-size:9px;font-weight:700;color:#7c3aed;min-width:36px;text-align:right;">{{ (swastikData.total_qty > 0 ? row.qty / swastikData.total_qty * 100 : 0).toFixed(1) }}%</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="sd-card sd-anim" style="animation-delay:0.14s">
            <div class="sd-card-head">
              <div class="sd-card-icon" style="background:#fef3c7;color:#d97706;">📋</div>
              <div style="flex:1;"><div class="sd-card-title">Reservation Detail</div></div>
            </div>
            <div v-if="swastikData && swastikData.detail && swastikData.detail.length">
              <table class="sd-table">
                <thead><tr><th>Company</th><th>Item</th><th>Warehouse</th><th style="text-align:right;">Qty</th><th style="text-align:right;">Value</th></tr></thead>
                <tbody>
                  <tr v-for="(row, i) in swastikData.detail" :key="i">
                    <td><span class="sd-badge" style="color:#0891b2;background:#ecfeff;">{{ row.company }}</span></td>
                    <td style="font-weight:700;">{{ row.item_code }}</td>
                    <td style="font-size:10px;color:#94a3b8;">{{ row.warehouse }}</td>
                    <td style="text-align:right;font-weight:800;color:#d97706;">{{ sd_n(row.qty) }}</td>
                    <td style="text-align:right;font-weight:700;color:#059669;">{{ sd_k(row.val) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>
<style>
.sd { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; padding: 0 20px 20px; }
.sd * { box-sizing: border-box; }
.top-bars { position: sticky; top: 0; z-index: 50; background: #f0f4f8; border-radius: 14px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 6px; padding: 6px; }
.sd-bar { display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; flex-wrap: wrap; }
.sd-bar label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; display: flex; align-items: center; line-height: 1; margin: 0; }
.sd-bar select { padding: 5px 26px 5px 8px; border-radius: 7px; border: 1px solid #e2e8f0; background: #f8fafc; color: #334155; font-size: 11px; font-weight: 600; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%2394a3b8'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 7px center; }
.sd-bar select:focus { outline: none; border-color: #3b82f6; }
.sd-filter-tag { font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 6px; background: #eff6ff; color: #3b82f6; white-space: nowrap; }
.sd-tabs { display: flex; gap: 2px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 3px; width: fit-content; }
.sd-tab-btn { padding: 6px 16px; border-radius: 8px; border: none; background: transparent; font-size: 11px; font-weight: 700; cursor: pointer; color: #94a3b8; transition: all 0.2s; }
.sd-tab-btn:hover { color: #475569; background: #f8fafc; }
.sd-tab-active { background: #3b82f6 !important; color: #fff !important; }
.sd-kpi-row { display: grid; gap: 10px; margin-bottom: 14px; grid-template-columns: repeat(5, 1fr); }
.sd-kpi { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 12px; }
.sd-kpi:hover { box-shadow: 0 4px 12px rgba(0,20,40,0.08); transform: translateY(-2px); }
.sd-kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.sd-kpi-val { font-size: 20px; font-weight: 800; line-height: 1.1; }
.sd-kpi-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-top: 1px; }
.sd-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 14px; }
.sd-card-head { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.sd-card-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; }
.sd-card-title { font-size: 12px; font-weight: 700; color: #1e293b; }
.sd-card-sub { font-size: 9px; color: #94a3b8; }
.sd-table { width: 100%; border-collapse: collapse; font-size: 11px; }
.sd-table th { text-align: left; padding: 7px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
.sd-table td { padding: 8px 10px; border-bottom: 1px solid #f8fafc; color: #475569; }
.sd-table tr { cursor: pointer; transition: background 0.15s; }
.sd-table tr:hover { background: #f1f5f9; }
.sd-badge { display: inline-block; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
.sd-link { font-size: 10px; font-weight: 600; color: #3b82f6; cursor: pointer; text-decoration: none; }
.sd-link:hover { text-decoration: underline; }
.sd-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
.sd-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 14px; }
.sd-grid-5-5 { display: grid; grid-template-columns: 5fr 5fr; gap: 12px; margin-bottom: 14px; }
.sd-grid-6-4 { display: grid; grid-template-columns: 6fr 4fr; gap: 12px; margin-bottom: 14px; }
.sd-prog { height: 5px; border-radius: 5px; background: #f1f5f9; overflow: hidden; }
.sd-prog-fill { height: 100%; border-radius: 5px; transition: width 0.6s ease; }
.sd-co-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 10px; transition: all 0.2s; }
.sd-co-card:hover { box-shadow: 0 2px 8px rgba(0,20,40,0.06); }
.sd-co-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.sd-co-name { font-size: 14px; font-weight: 800; }
.sd-co-stats { display: flex; gap: 12px; }
.sd-co-stat { font-size: 10px; font-weight: 700; color: #64748b; }
.sd-co-stat span { font-size: 13px; font-weight: 800; display: block; margin-top: 1px; }
.sd-wh { border: 1px solid #f1f5f9; border-radius: 8px; padding: 10px; margin-bottom: 6px; transition: all 0.15s; }
.sd-wh:hover { border-color: #e2e8f0; background: #f8fafc; }
.sd-wh-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.sd-wh-name { font-size: 10px; font-weight: 700; color: #1e293b; }
.sd-wh-stats { font-size: 9px; color: #94a3b8; }
.sd-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; margin-bottom: 3px; transition: background 0.15s; }
.sd-item:hover { background: #f1f5f9; }
.sd-item-name { flex: 1; font-size: 10px; font-weight: 700; color: #1e293b; }
.sd-item-qty { font-size: 11px; font-weight: 800; }
.sd-item-val { font-size: 9px; color: #94a3b8; }
.sd-ring { position: relative; display: inline-block; }
.sd-neg { border-left: 3px solid #dc2626; background: #fef2f2; border-radius: 0 8px 8px 0; padding: 8px 12px; margin-bottom: 6px; }
@keyframes sdFadeIn { 0%{opacity:0;transform:translateY(8px);}100%{opacity:1;transform:translateY(0);} }
.sd-anim { animation: sdFadeIn 0.35s ease both; }
.sd-ms { position: relative; display: inline-block; }
.sd-ms-btn { display: flex; align-items: center; gap: 6px; padding: 5px 28px 5px 10px; border-radius: 7px; border: 1px solid #e2e8f0; background: #f8fafc; color: #334155; font-size: 11px; font-weight: 600; cursor: pointer; min-width: 120px; white-space: nowrap; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%2394a3b8'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; transition: border-color 0.2s; }
.sd-ms-btn:hover { border-color: #cbd5e1; }
.sd-ms-btn.sd-ms-open { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.sd-ms-btn .sd-ms-count { background: #059669; color: #fff; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 10px; }
.sd-ms-panel { display: none; position: fixed; z-index: 9999; min-width: 220px; max-height: 280px; overflow-y: auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,20,40,0.12); padding: 6px; }
.sd-ms-panel.sd-ms-show { display: block; }
.sd-ms-search { width: 100%; padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; outline: none; margin-bottom: 4px; }
.sd-ms-search:focus { border-color: #3b82f6; }
.sd-ms-actions { display: flex; gap: 4px; padding: 4px 0; border-bottom: 1px solid #f1f5f9; margin-bottom: 4px; }
.sd-ms-action { padding: 3px 8px; border-radius: 5px; border: none; background: transparent; font-size: 9px; font-weight: 700; cursor: pointer; color: #3b82f6; }
.sd-ms-action:hover { background: #eff6ff; }
.sd-ms-opt { display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 6px; cursor: pointer; transition: background 0.1s; }
.sd-ms-opt:hover { background: #f1f5f9; }
.sd-ms-opt input[type="checkbox"] { accent-color: #3b82f6; width: 14px; height: 14px; cursor: pointer; }
.sd-ms-opt-label { font-size: 11px; font-weight: 600; color: #334155; flex: 1; }
.sd-ms-opt-abbr { font-size: 9px; font-weight: 700; color: #94a3b8; }
</style>
<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent, IonMenuButton } from '@ionic/vue'
import { frappeRequest } from 'frappe-ui'

const API = 'oil_distribution.oil_distribution.page.stock_dashboard.stock_dashboard'

const COMPANY_INFO = {
  'Geeta Enterprise': { bg: '#eff6ff', accent: '#3b82f6', abbr: 'GE' },
  'Global Export': { bg: '#ecfdf5', accent: '#10b981', abbr: 'GEX' },
  'Shubham Enterprise': { bg: '#fef3c7', accent: '#f59e0b', abbr: 'SHE' }
}
const COMPANY_OPTIONS = [
  { value: 'Geeta Enterprise', label: 'Geeta Enterprise', abbr: 'GE' },
  { value: 'Global Export', label: 'Global Export', abbr: 'GEX' },
  { value: 'Shubham Enterprise', label: 'Shubham Enterprise', abbr: 'SHE' }
]
const ALL_CO = ['Geeta Enterprise', 'Global Export', 'Shubham Enterprise']

const activeTab = ref('overview')
const kpiData = ref(null)
const companyData = ref([])
const warehouseData = ref([])
const negativeData = ref([])
const itemData = ref([])
const swastikData = ref(null)
const kpiAnimated = ref(false)

const companyMsOpen = ref(false)
const itemMsOpen = ref(false)
const companySelected = ref([...ALL_CO])
const itemSelected = ref([])
const companySearch = ref('')
const itemSearch = ref('')
const companyOptions = ref([...COMPANY_OPTIONS])
const itemOptions = ref([])
const companyErr = ref(false)
const itemErr = ref(false)

const companyMsContainer = ref(null)
const companyMsBtn = ref(null)
const companyMsPanel = ref(null)
const itemMsContainer = ref(null)
const itemMsBtn = ref(null)
const itemMsPanel = ref(null)
const chartCompanyEl = ref(null)
const chartWhEl = ref(null)

const companyPanelPos = reactive({ left: 0, top: 0 })
const itemPanelPos = reactive({ left: 0, top: 0 })

const companyPanelStyle = computed(() => ({ left: companyPanelPos.left + 'px', top: companyPanelPos.top + 'px' }))
const itemPanelStyle = computed(() => ({ left: itemPanelPos.left + 'px', top: itemPanelPos.top + 'px' }))

function getCompanyFilter() {
  const sel = companySelected.value
  if (sel.length === 0 || sel.length === ALL_CO.length) return 'All'
  return sel.join(',')
}
function getItemFilter() {
  const sel = itemSelected.value
  const total = itemOptions.value.length
  if (sel.length === 0 || (total > 0 && sel.length === total)) return 'All'
  return sel.join(',')
}

const companyBtnLabel = computed(() => {
  const sel = companySelected.value
  if (sel.length === 0 || sel.length === ALL_CO.length) return 'All'
  if (sel.length === 1) {
    const opt = COMPANY_OPTIONS.find(o => o.value === sel[0])
    return (opt ? (opt.abbr || opt.label || sel[0]) : sel[0]) + ' <span class="sd-ms-count">' + sel.length + '</span>'
  }
  return 'Selected ' + sel.length + ' <span class="sd-ms-count">' + sel.length + '</span>'
})
const itemBtnLabel = computed(() => {
  const sel = itemSelected.value
  const total = itemOptions.value.length
  if (sel.length === 0 || (total > 0 && sel.length === total)) return 'All'
  if (sel.length === 1) return sel[0] + ' <span class="sd-ms-count">' + sel.length + '</span>'
  return 'Selected ' + sel.length + ' <span class="sd-ms-count">' + sel.length + '</span>'
})
const filteredCompanyOptions = computed(() => {
  const q = companySearch.value.toLowerCase()
  return companyOptions.value.filter(o => o.label.toLowerCase().indexOf(q) !== -1)
})
const filteredItemOptions = computed(() => {
  const q = itemSearch.value.toLowerCase()
  return itemOptions.value.filter(o => o.label.toLowerCase().indexOf(q) !== -1)
})
const filterTagLabel = computed(() => {
  const co = getCompanyFilter()
  if (co === 'All') return 'All Companies'
  return co.split(',').map(c => (COMPANY_INFO[c] || {}).abbr || c).join(', ')
})
const filterTagStyle = computed(() => {
  const co = getCompanyFilter()
  if (co === 'All') return { background: '#eff6ff', color: '#3b82f6' }
  return { background: '#ecfdf5', color: '#059669' }
})

const kpiCards = computed(() => {
  if (!kpiData.value) return []
  const d = kpiData.value
  return [
    { val: sd_n(d.available_stock || d.available_qty) + ' L', lbl: 'Available Stock', icon: '📦', bg: '#ede9fe', color: '#7c3aed', routeFn: () => frappe.set_route('List', 'Bin', { warehouse: ['like', 'Available WH%'] }) },
    { val: sd_n(d.reserved_stock || d.reserved_qty) + ' L', lbl: 'Swastik Reserved', icon: '🔒', bg: '#fef3c7', color: '#d97706', routeFn: () => frappe.set_route('List', 'Stock Reservation', { status: 'Reserved' }) },
    { val: String(d.items_count), lbl: 'Items in Stock', icon: '📋', bg: '#dbeafe', color: '#3b82f6', routeFn: () => frappe.set_route('List', 'Item') },
    { val: String(d.warehouse_count), lbl: 'Active Warehouses', icon: '🏭', bg: '#d1fae5', color: '#059669', routeFn: () => frappe.set_route('List', 'Warehouse') },
    { val: String(d.negative_count), lbl: 'Negative Alerts', icon: '⚠', bg: '#fef2f2', color: '#dc2626', routeFn: () => frappe.set_route('List', 'Bin', { actual_qty: ['<', 0] }) }
  ].map(k => ({ ...k, displayVal: kpiAnimated.value ? k.val : '--' }))
})

const quickStatsItems = computed(() => {
  if (!kpiData.value) return []
  const d = kpiData.value
  return [
    { lbl: 'Total Stock', val: sd_n(d.total_stock) + ' L', color: '#1e293b', bg: '#f8fafc' },
    { lbl: 'Total Value', val: sd_k(d.total_value), color: '#1e293b', bg: '#f8fafc' },
    { lbl: 'Available Value', val: sd_k(d.available_value), color: '#3b82f6', bg: '#eff6ff' },
    { lbl: 'Reserved Value', val: sd_k(d.reserved_value), color: '#f59e0b', bg: '#fffbeb' },
    { lbl: 'Items', val: d.items_count, color: '#7c3aed', bg: '#ede9fe' },
    { lbl: 'Warehouses', val: d.warehouse_count, color: '#059669', bg: '#d1fae5' }
  ]
})

const companyDetailCards = computed(() => {
  return companyData.value.map(d => {
    const s = COMPANY_INFO[d.company] || { bg: '#f8fafc', accent: '#64748b', abbr: (d.company || '').substring(0, 3).toUpperCase() }
    const total = (d.avail_qty || 0) + (d.reserved_qty || 0)
    return { ...d, bg: s.bg, accent: s.accent, abbr: s.abbr, availPct: total > 0 ? Math.round((d.avail_qty / total) * 100) : 0 }
  })
})

const negByCompany = computed(() => {
  const byCo = {}
  negativeData.value.forEach(row => {
    if (!byCo[row.company]) byCo[row.company] = []
    byCo[row.company].push(row)
  })
  return byCo
})
const negTotalVal = computed(() => negativeData.value.reduce((s, r) => s + Math.abs(r.stock_value || 0), 0))

const whByCompany = computed(() => {
  const companies = {}
  warehouseData.value.forEach(wh => {
    if (!companies[wh.company]) companies[wh.company] = { warehouses: [], total_qty: 0, total_value: 0, total_items: 0 }
    companies[wh.company].warehouses.push(wh)
    companies[wh.company].total_qty += wh.total_qty
    companies[wh.company].total_value += wh.total_value
    companies[wh.company].total_items += wh.item_count
  })
  Object.keys(companies).forEach(co => {
    companies[co].warehouses.sort((a, b) => {
      const aA = a.warehouse.indexOf('Available WH') !== -1 ? 0 : a.warehouse.indexOf('Reserved WH') !== -1 ? 1 : 2
      const bA = b.warehouse.indexOf('Available WH') !== -1 ? 0 : b.warehouse.indexOf('Reserved WH') !== -1 ? 1 : 2
      return aA - bA
    })
  })
  return companies
})

const itemTableCos = computed(() => {
  const allCos = {}
  itemData.value.forEach(item => { Object.keys(item.companies).forEach(co => { allCos[co] = 1 }) })
  return Object.keys(allCos).sort()
})

const swastikKpis = computed(() => {
  if (!swastikData.value) return []
  const d = swastikData.value
  return [
    { val: sd_n(d.total_qty) + ' L', lbl: 'Total Reserved', icon: '🔒', bg: '#fef3c7', color: '#d97706' },
    { val: sd_k(d.total_value), lbl: 'Total Value', icon: '₹', bg: '#ecfdf5', color: '#059669' },
    { val: d.companies_count, lbl: 'Companies', icon: '🏢', bg: '#dbeafe', color: '#3b82f6' },
    { val: d.items_count, lbl: 'Items Reserved', icon: '📦', bg: '#ede9fe', color: '#7c3aed' }
  ]
})

function companyColor(name) { return COMPANY_INFO[name] || { bg: '#f8fafc', accent: '#64748b', abbr: (name || '').substring(0, 3).toUpperCase() } }
function companySuffix(co) { return (COMPANY_INFO[co] || {}).abbr || co.substring(0, 3).toUpperCase() }
function whTag(wh) { return wh.warehouse.indexOf('Available WH') !== -1 ? 'Available' : wh.warehouse.indexOf('Reserved WH') !== -1 ? 'Reserved' : 'Other' }
function whTagColor(wh) { const t = whTag(wh); return t === 'Available' ? '#10b981' : t === 'Reserved' ? '#f59e0b' : '#94a3b8' }
function whTagBg(wh) { const t = whTag(wh); return t === 'Available' ? '#ecfdf5' : t === 'Reserved' ? '#fffbeb' : '#f8fafc' }

function sd_k(v) { v = parseFloat(v) || 0; if (Math.abs(v) >= 1000) return '₹' + (v / 1000).toFixed(1) + 'K'; return '₹' + v.toFixed(0) }
function sd_n(v) { v = parseFloat(v) || 0; if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + 'K'; return v.toFixed(0) }
function sd_count(el, target, pre, suf, dur) {
  pre = pre || ''; suf = suf || ''; dur = dur || 1200
  let start = null
  function step(ts) { if (!start) start = ts; const p = Math.min((ts - start) / dur, 1); const e = 1 - Math.pow(1 - p, 3); el.textContent = pre + Math.floor(e * target).toLocaleString() + suf; if (p < 1) requestAnimationFrame(step) }
  requestAnimationFrame(step)
}

function sd_donut(el, avail, reserved) {
  const total = (avail || 0) + (reserved || 0)
  if (total === 0) { el.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:11px;">No stock data</div>'; return }
  const pct = Math.round((reserved / total) * 100)
  const uid = 'sddu' + Math.random().toString(36).slice(2, 8)
  const sz = 100, st = 14, r = (sz - st) / 2, circ = 2 * Math.PI * r, ct = sz / 2
  const agap = 0.015, cAvail = '#3b82f6', cRes = '#f59e0b'
  const aDash = circ * Math.max(0, (100 - pct) / 100 - agap)
  const rDash = circ * Math.max(0, pct / 100 - agap)
  const rOff = -circ * (100 - pct) / 100
  let s = '<div style="display:flex;align-items:center;gap:16px;justify-content:center;padding:6px 0;">'
  s += '<div style="position:relative;width:' + sz + 'px;height:' + sz + 'px;flex-shrink:0;">'
  s += '<svg width="' + sz + '" height="' + sz + '" style="transform:rotate(-90deg);">'
  s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="#f1f5f9" stroke-width="' + st + '"/>'
  s += '<circle data-idx="0" cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="' + cAvail + '" stroke-width="' + st + '" stroke-linecap="round" stroke-dasharray="0 ' + circ + '" data-target="' + aDash + '" style="cursor:pointer;transition:stroke-dasharray 0.6s ease,stroke-width 0.2s,opacity 0.2s;">'
  s += '<title>Available: ' + sd_n(avail) + ' (' + (100 - pct) + '%)</title></circle>'
  s += '<circle data-idx="1" cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="' + cRes + '" stroke-width="' + st + '" stroke-linecap="round" stroke-dasharray="0 ' + circ + '" stroke-dashoffset="' + rOff + '" data-target="' + rDash + '" style="cursor:pointer;transition:stroke-dasharray 0.6s ease,stroke-width 0.2s,opacity 0.2s;">'
  s += '<title>Reserved: ' + sd_n(reserved) + ' (' + pct + '%)</title></circle>'
  s += '</svg>'
  s += '<div id="' + uid + '-ctr" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;transition:all 0.2s;">'
  s += '<span id="' + uid + '-pct" style="font-size:20px;font-weight:800;color:#1e293b;line-height:1;">' + pct + '%</span>'
  s += '<span id="' + uid + '-lbl" style="font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;color:#94a3b8;margin-top:2px;">Reserved</span>'
  s += '</div></div>'
  s += '<div id="' + uid + '-leg" style="display:flex;flex-direction:column;gap:5px;">'
  s += '<div class="sd-donut-leg" data-idx="0" style="display:flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;cursor:pointer;transition:all 0.15s;border:1px solid transparent;">'
  s += '<div style="width:8px;height:8px;border-radius:2px;background:' + cAvail + ';flex-shrink:0;"></div>'
  s += '<div style="flex:1;min-width:0;"><div style="font-size:10px;font-weight:700;color:#1e293b;">Available</div><div style="font-size:8px;color:#94a3b8;">' + sd_n(avail) + ' L</div></div>'
  s += '<div style="width:30px;height:3px;border-radius:3px;background:#f1f5f9;overflow:hidden;"><div style="height:100%;width:' + (100 - pct) + '%;background:' + cAvail + ';border-radius:3px;"></div></div></div>'
  s += '<div class="sd-donut-leg" data-idx="1" style="display:flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;cursor:pointer;transition:all 0.15s;border:1px solid transparent;">'
  s += '<div style="width:8px;height:8px;border-radius:2px;background:' + cRes + ';flex-shrink:0;"></div>'
  s += '<div style="flex:1;min-width:0;"><div style="font-size:10px;font-weight:700;color:#1e293b;">Reserved</div><div style="font-size:8px;color:#94a3b8;">' + sd_n(reserved) + ' L</div></div>'
  s += '<div style="width:30px;height:3px;border-radius:3px;background:#f1f5f9;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:' + cRes + ';border-radius:3px;"></div></div></div>'
  s += '<div style="display:flex;align-items:center;gap:6px;padding:2px 8px;margin-top:2px;border-top:1px solid #f1f5f9;">'
  s += '<div style="width:8px;height:8px;border-radius:2px;background:#cbd5e1;flex-shrink:0;"></div>'
  s += '<div style="font-size:9px;font-weight:600;color:#64748b;flex:1;">Total</div>'
  s += '<div style="font-size:10px;font-weight:700;color:#1e293b;">' + sd_n(total) + ' L</div>'
  s += '</div></div></div>'
  el.innerHTML = s
  setTimeout(() => {
    el.querySelectorAll('circle[data-target]').forEach(a => {
      const t = a.getAttribute('data-target')
      requestAnimationFrame(() => { a.setAttribute('stroke-dasharray', t + ' ' + (circ - t)) })
    })
  }, 80)
  setTimeout(() => {
    const segs = el.querySelectorAll('circle[data-idx]')
    const legs = el.querySelectorAll('.sd-donut-leg')
    const ctr = document.getElementById(uid + '-ctr')
    const pctEl = document.getElementById(uid + '-pct')
    const lblEl = document.getElementById(uid + '-lbl')
    const colors = [cAvail, cRes]
    const labels = ['Available', 'Reserved']
    const pcts = [100 - pct, pct]
    function hl(idx) {
      segs.forEach((c, i) => { if (idx === null) { c.style.strokeWidth = st; c.style.opacity = 1 } else if (i === idx) { c.style.strokeWidth = st + 4; c.style.opacity = 1 } else { c.style.strokeWidth = st - 4; c.style.opacity = 0.3 } })
      legs.forEach((l, i) => { if (idx === null) { l.style.borderColor = 'transparent'; l.style.background = 'transparent' } else if (i === idx) { l.style.borderColor = colors[i]; l.style.background = colors[i] + '0c' } else { l.style.borderColor = 'transparent'; l.style.background = 'transparent' } })
      if (idx !== null && pctEl) { pctEl.textContent = pcts[idx] + '%'; pctEl.style.color = colors[idx]; lblEl.textContent = labels[idx] }
      else if (pctEl) { pctEl.textContent = pct + '%'; pctEl.style.color = '#1e293b'; lblEl.textContent = 'Reserved' }
    }
    segs.forEach((c, i) => { c.addEventListener('mouseenter', () => hl(i)); c.addEventListener('mouseleave', () => hl(null)) })
    legs.forEach((l, i) => { l.addEventListener('mouseenter', () => hl(i)); l.addEventListener('mouseleave', () => hl(null)) })
  }, 100)
}

function sd_stacked_bars(el, labels, series, rawData) {
  if (!labels || !labels.length) { el.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;">No data</div>'; return }
  rawData = rawData || []
  const W = 420, H = 210, P = { t: 16, r: 16, b: 48, l: 54 }
  const cw = W - P.l - P.r, ch = H - P.t - P.b
  const maxStack = labels.map((_, i) => series.reduce((s, ser) => s + (ser.values[i] || 0), 0))
  const mx = Math.max(...maxStack) * 1.15 || 1
  const barW = Math.min(cw / labels.length * 0.45, 38)
  const uid = 'sbc' + Math.random().toString(36).slice(2, 8)
  let s = ''
  s += '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:' + H + 'px;overflow:visible;">'
  s += '<defs>'
  series.forEach((ser, si) => {
    s += '<linearGradient id="' + uid + '-g' + si + '" x1="0" y1="0" x2="0" y2="1">'
    s += '<stop offset="0%" stop-color="' + ser.color + '"/>'
    s += '<stop offset="100%" stop-color="' + ser.color + '" stop-opacity="0.65"/>'
    s += '</linearGradient>'
  })
  s += '<filter id="' + uid + '-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
  s += '<filter id="' + uid + '-shadow" x="-4%" y="-4%" width="108%" height="112%"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.08"/></filter>'
  s += '</defs>'
  for (let g = 0; g <= 4; g++) {
    const gy = P.t + (g / 4) * ch
    s += '<line x1="' + P.l + '" y1="' + gy + '" x2="' + (W - P.r) + '" y2="' + gy + '" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="3,3"/>'
    s += '<text x="' + (P.l - 8) + '" y="' + (gy + 3.5) + '" text-anchor="end" fill="#94a3b8" font-size="8" font-weight="600">' + sd_k(mx * (1 - g / 4)) + '</text>'
  }
  const totalPerCompany = labels.map((_, i) => series.reduce((s, ser) => s + (ser.values[i] || 0), 0))
  labels.forEach((l, i) => {
    const cx = P.l + (i + 0.5) * (cw / labels.length)
    let cumY = 0
    series.forEach((ser, si) => {
      const v = ser.values[i] || 0
      const h = (v / mx) * ch
      const y = P.t + ch - cumY - h
      const barId = uid + '-' + i + '-' + si
      const pct = totalPerCompany[i] > 0 ? Math.round((v / totalPerCompany[i]) * 100) : 0
      s += '<rect id="' + barId + '" x="' + (cx - barW / 2) + '" y="' + (P.t + ch) + '" width="' + barW + '" height="0" fill="url(#' + uid + '-g' + si + ')" rx="3" filter="url(#' + uid + '-shadow)" style="cursor:pointer;transition:all 0.3s cubic-bezier(.4,0,.2,1);"'
      s += ' data-target-y="' + y + '" data-target-h="' + Math.max(1, h) + '" data-idx="' + i + '" data-series="' + si + '" data-pct="' + pct + '"'
      s += ' onmouseenter="sd_bc_hover(this,\'' + l + '\',' + i + ')" onmouseleave="sd_bc_leave(this)" onclick="sd_bc_click(this)">'
      s += '<title>' + l + '\n' + ser.name + ': ' + sd_n(v) + ' L (' + pct + '%)</title></rect>'
      if (h > 18 && pct > 5) {
        s += '<text id="' + barId + '-lbl" x="' + cx + '" y="' + (P.t + ch) + '" text-anchor="middle" fill="#fff" font-size="8" font-weight="800" style="pointer-events:none;opacity:0;transition:opacity 0.3s;">' + pct + '%</text>'
      }
      cumY += h
    })
    s += '<text x="' + cx + '" y="' + (H - 24) + '" text-anchor="middle" fill="#475569" font-size="9" font-weight="700">' + l + '</text>'
    s += '<text x="' + cx + '" y="' + (H - 12) + '" text-anchor="middle" fill="#94a3b8" font-size="7" font-weight="600">' + sd_k(totalPerCompany[i]) + '</text>'
  })
  s += '<g transform="translate(' + (W / 2 - 60) + ',' + (H - 2) + ')">'
  series.forEach((ser, si) => {
    const lx = si * 80
    s += '<rect x="' + lx + '" y="-6" width="10" height="10" rx="2" fill="' + ser.color + '" opacity="0.85"/>'
    s += '<text x="' + (lx + 14) + '" y="2" fill="#64748b" font-size="8" font-weight="700">' + ser.name + '</text>'
  })
  s += '</g></svg>'
  s += '<div id="' + uid + '-tip" style="display:none;position:fixed;z-index:9999;background:#1e293b;color:#fff;padding:12px 16px;border-radius:10px;font-size:10px;line-height:1.7;pointer-events:none;box-shadow:0 12px 32px rgba(0,0,0,0.25);max-width:240px;border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(8px);"></div>'
  el.setAttribute('data-raw', JSON.stringify(rawData))
  el.setAttribute('data-uid', uid)
  el.innerHTML = s
  setTimeout(() => {
    labels.forEach((_, i) => {
      series.forEach((ser, si) => {
        const bar = document.getElementById(uid + '-' + i + '-' + si)
        if (!bar) return
        setTimeout(() => {
          bar.setAttribute('y', bar.getAttribute('data-target-y'))
          bar.setAttribute('height', bar.getAttribute('data-target-h'))
        }, i * 60 + si * 30)
      })
    })
  }, 50)
}

function sd_bc_hover(el, label, idx) {
  el.style.filter = 'url(#' + el.closest('svg').querySelector('filter').id.split('-')[0] + '-glow)'
  el.style.opacity = '0.85'
  const svg = el.closest('svg')
  if (!svg) return
  const uid = svg.parentElement.getAttribute('data-uid')
  const tip = document.getElementById(uid + '-tip')
  if (!tip) return
  const raw = JSON.parse(svg.parentElement.getAttribute('data-raw') || '[]')
  const d = raw[idx] || {}
  const total = (d.avail_qty || 0) + (d.reserved_qty || 0)
  let html = '<div style="font-weight:800;margin-bottom:6px;font-size:12px;color:#f1f5f9;">' + (d.company || label) + '</div>'
  html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="width:8px;height:8px;border-radius:50%;background:#3b82f6;display:inline-block;"></span> Available: <b style="color:#93c5fd;">' + sd_n(d.avail_qty || 0) + ' L</b></div>'
  html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;"><span style="width:8px;height:8px;border-radius:50%;background:#f59e0b;display:inline-block;"></span> Reserved: <b style="color:#fcd34d;">' + sd_n(d.reserved_qty || 0) + ' L</b></div>'
  html += '<div style="border-top:1px solid rgba(255,255,255,0.12);margin-top:5px;padding-top:5px;color:#cbd5e1;font-size:11px;">Total: <b>' + sd_n(total) + ' L</b></div>'
  html += '<div style="color:#94a3b8;font-size:9px;margin-top:3px;">Value: ' + sd_k(d.total_value || 0) + ' · Items: ' + (d.item_count || 0) + '</div>'
  tip.innerHTML = html; tip.style.display = 'block'
  const rect = el.getBoundingClientRect()
  tip.style.left = (rect.right + 12) + 'px'; tip.style.top = rect.top + 'px'
  svg.querySelectorAll('rect[data-idx]').forEach(b => {
    if (b.getAttribute('data-idx') !== String(idx)) b.style.opacity = '0.2'
    else { const lbl = document.getElementById(b.id + '-lbl'); if (lbl) lbl.style.opacity = '1' }
  })
}

function sd_bc_leave(el) {
  el.style.filter = 'url(#' + el.closest('svg').querySelector('filter').id.split('-')[0] + '-shadow)'
  el.style.opacity = '1'
  const svg = el.closest('svg')
  if (!svg) return
  const uid = svg.parentElement.getAttribute('data-uid')
  const tip = document.getElementById(uid + '-tip')
  if (tip) tip.style.display = 'none'
  svg.querySelectorAll('rect[data-idx]').forEach(b => { b.style.opacity = '1' })
  svg.querySelectorAll('text[id$="-lbl"]').forEach(t => { t.style.opacity = '0' })
}

function sd_bc_click(el) {
  const svg = el.closest('svg')
  if (!svg) return
  const raw = JSON.parse(svg.parentElement.getAttribute('data-raw') || '[]')
  const d = raw[parseInt(el.getAttribute('data-idx'))] || {}
  if (d.company) frappe.set_route('List', 'Bin', { company: d.company })
}
window.sd_bc_hover = sd_bc_hover; window.sd_bc_leave = sd_bc_leave; window.sd_bc_click = sd_bc_click

function toggleCompanyMs() {
  if (companyMsOpen.value) { companyMsOpen.value = false; return }
  itemMsOpen.value = false
  nextTick(() => {
    const btn = companyMsBtn.value
    if (btn) { const rect = btn.getBoundingClientRect(); companyPanelPos.left = rect.left; companyPanelPos.top = rect.bottom + 4 }
    companyMsOpen.value = true
  })
}
function toggleItemMs() {
  if (itemMsOpen.value) { itemMsOpen.value = false; return }
  companyMsOpen.value = false
  nextTick(() => {
    const btn = itemMsBtn.value
    if (btn) { const rect = btn.getBoundingClientRect(); itemPanelPos.left = rect.left; itemPanelPos.top = rect.bottom + 4 }
    itemMsOpen.value = true
  })
}
function selectAllCompany() { companySelected.value = [...ALL_CO]; onCompanyChange() }
function clearCompany() {
  if (companySelected.value.length <= 1) { companyErr.value = true; setTimeout(() => { companyErr.value = false }, 2000); return }
  companySelected.value = [companySelected.value[0]]; onCompanyChange()
}
function selectAllItem() { itemSelected.value = itemOptions.value.map(o => o.value); onItemChange() }
function clearItem() {
  if (itemSelected.value.length <= 1) { itemErr.value = true; setTimeout(() => { itemErr.value = false }, 2000); return }
  itemSelected.value = [itemSelected.value[0]]; onItemChange()
}
function onCompanyChange() { load_all() }
function onItemChange() { load_all() }

function handleDocClick(e) {
  if (companyMsOpen.value) {
    const c = companyMsContainer.value, p = companyMsPanel.value
    if (c && !c.contains(e.target) && p && !p.contains(e.target)) companyMsOpen.value = false
  }
  if (itemMsOpen.value) {
    const c = itemMsContainer.value, p = itemMsPanel.value
    if (c && !c.contains(e.target) && p && !p.contains(e.target)) itemMsOpen.value = false
  }
}

async function load_all() {
  const co = getCompanyFilter()
  const item = getItemFilter()
  const args = { company: co, item: item }

  Promise.all([
    frappeRequest({ url: API + '.get_stock_kpis', params: args }).then(d => {
      kpiData.value = d
      kpiAnimated.value = false
      setTimeout(() => {
        kpiAnimated.value = true
        nextTick(() => {
          if (chartWhEl.value) sd_donut(chartWhEl.value, d.available_stock || d.available_qty || 0, d.reserved_stock || d.reserved_qty || 0)
        })
      }, 1300)
    }).catch(() => { kpiData.value = null }),

    frappeRequest({ url: API + '.get_stock_by_company', params: args }).then(d => {
      companyData.value = d || []
      nextTick(() => {
        if (chartCompanyEl.value && d && d.length) {
          const labels = d.map(x => x.company.replace(' Enterprise', '').replace(' Export', ''))
          sd_stacked_bars(chartCompanyEl.value, labels, [
            { name: 'Available', values: d.map(x => x.avail_qty), color: '#3b82f6' },
            { name: 'Reserved', values: d.map(x => x.reserved_qty), color: '#f59e0b' }
          ], d)
        }
      })
    }).catch(() => { companyData.value = [] }),

    frappeRequest({ url: API + '.get_stock_by_warehouse', params: args }).then(d => {
      warehouseData.value = d || []
    }).catch(() => { warehouseData.value = [] }),

    frappeRequest({ url: API + '.get_negative_stock', params: args }).then(d => {
      negativeData.value = d || []
    }).catch(() => { negativeData.value = [] }),

    frappeRequest({ url: API + '.get_stock_by_item', params: args }).then(d => {
      itemData.value = d || []
    }).catch(() => { itemData.value = [] }),

    frappeRequest({ url: API + '.get_swastik_detail', params: args }).then(d => {
      swastikData.value = d || null
    }).catch(() => { swastikData.value = null })
  ])
}

onMounted(() => {
  document.addEventListener('click', handleDocClick)
  frappeRequest({ url: 'frappe.client.get_list', params: { doctype: 'Item', fields: JSON.stringify(['item_code', 'item_name']), limit_page_length: 0, order_by: 'item_code asc' } }).then(items => {
    if (!items) return
    itemOptions.value = items.map(item => ({ value: item.item_code, label: item.item_code + ' — ' + item.item_name }))
    itemSelected.value = itemOptions.value.map(o => o.value)
  }).catch(() => {})
  load_all()
})

onUnmounted(() => { document.removeEventListener('click', handleDocClick) })
</script>
