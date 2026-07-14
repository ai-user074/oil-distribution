<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Command Center</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="oz">
        <div class="top-bars">
        <div class="oz-bar oz-anim">
          <label>Company</label>
          <div id="oz-ms-company" class="oz-ms"></div>
          <label style="margin-left:8px;">Item</label>
          <div id="oz-ms-item" class="oz-ms" style="min-width:200px;"></div>
          <label style="margin-left:8px;">FY</label>
          <div id="oz-ms-fy" class="oz-ms" style="min-width:180px;"></div>
          <div style="margin-left:auto;display:flex;gap:6px;flex-shrink:0;">
            <span id="oz-filter-company" class="oz-filter-tag"></span>
            <span id="oz-filter-fy" class="oz-filter-tag"></span>
          </div>
        </div>
        <div class="oz-tabs oz-anim" style="animation-delay:0.04s">
          <button class="oz-tab-btn oz-tab-active" data-tab="sales">Sales &amp; Procurement</button>
          <button class="oz-tab-btn" data-tab="stock">Stock Intelligence</button>
          <button class="oz-tab-btn" data-tab="ict">Inter Company Transfer</button>
          <button class="oz-tab-btn" data-tab="reservations">Reservations</button>
        </div>
        <div id="oz-period-bar" class="oz-bar oz-period-bar oz-anim" style="animation-delay:0.06s;">
          <label>Period</label>
          <button class="oz-period-btn oz-period-active" data-period="MTD">MTD</button>
          <button class="oz-period-btn" data-period="QTD">QTD</button>
          <button class="oz-period-btn" data-period="YTD">YTD</button>
          <div id="oz-month-controls" class="oz-period-controls">
            <span class="oz-period-label">Months:</span>
            <div id="oz-month-chips" style="display:flex;gap:4px;flex-wrap:wrap;"></div>
          </div>
          <div id="oz-qtr-controls" class="oz-period-controls" style="display:none;">
            <span class="oz-period-label">Quarters:</span>
            <div id="oz-qtr-chips" style="display:flex;gap:4px;flex-wrap:wrap;"></div>
          </div>
          <div id="oz-ytd-controls" class="oz-period-controls" style="display:none;">
            <span class="oz-period-label">FY:</span>
            <div id="oz-ytd-chips" style="display:flex;gap:4px;flex-wrap:wrap;"></div>
          </div>
          <div id="oz-compare-controls" class="oz-period-controls" style="display:flex;align-items:center;gap:8px;">
            <span class="oz-period-label">vs:</span>
            <div id="oz-compare-month" class="oz-cs"></div>
            <div id="oz-compare-qtr" class="oz-cs" style="display:none;"></div>
            <div id="oz-compare-fy" class="oz-cs" style="display:none;"></div>
          </div>
        </div>
</div>
        <div id="oz-panel-sales" class="oz-tab-panel">
          <div class="oz-kpi-row oz-kpi-row-3 oz-anim" style="animation-delay:0.08s">
            <div class="oz-kpi-card" style="flex-direction:column;align-items:stretch;cursor:pointer;">
              <div style="display:flex;align-items:center;gap:12px;">
                <div class="oz-kpi-icon" style="background:#dbeafe;color:#3b82f6;">&#8377;</div>
                <div class="oz-kpi-info">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <div class="oz-kpi-val" id="oz-kpi-sales" style="color:#3b82f6;">--</div>
                    <span id="oz-kpi-sales-change" style="font-size:9px;font-weight:700;"></span>
                  </div>
                  <div class="oz-kpi-lbl">Sales <span id="oz-period-sales" style="color:#3b82f6;">MTD</span></div>
                </div>
                <div class="oz-kpi-spark" id="oz-spark-sales"></div>
              </div>
              <div id="oz-sales-breakdown" style="margin-top:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;"></div>
            </div>
            <div class="oz-kpi-card" style="flex-direction:column;align-items:stretch;cursor:pointer;">
              <div style="display:flex;align-items:center;gap:12px;">
                <div class="oz-kpi-icon" style="background:#d1fae5;color:#059669;">&#8377;</div>
                <div class="oz-kpi-info">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <div class="oz-kpi-val" id="oz-kpi-proc" style="color:#059669;">--</div>
                    <span id="oz-kpi-proc-change" style="font-size:9px;font-weight:700;"></span>
                  </div>
                  <div class="oz-kpi-lbl">Procurement <span id="oz-period-proc" style="color:#059669;">MTD</span></div>
                </div>
                <div class="oz-kpi-spark" id="oz-spark-proc"></div>
              </div>
              <div id="oz-proc-breakdown" style="margin-top:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;"></div>
            </div>
            <div class="oz-kpi-card" style="flex-direction:column;align-items:stretch;cursor:pointer;">
              <div style="display:flex;align-items:center;gap:12px;">
                <div class="oz-kpi-icon" id="oz-kpi-pl-icon" style="background:#fef3c7;color:#d97706;">&#8377;</div>
                <div class="oz-kpi-info">
                  <div style="display:flex;align-items:center;gap:6px;">
                    <div class="oz-kpi-val" id="oz-kpi-pl" style="color:#d97706;">--</div>
                    <span id="oz-kpi-pl-change" style="font-size:9px;font-weight:700;"></span>
                  </div>
                  <div class="oz-kpi-lbl">Profit / Loss <span id="oz-period-pl" style="color:#d97706;">MTD</span></div>
                </div>
                <div class="oz-kpi-spark" id="oz-spark-pl"></div>
              </div>
              <div id="oz-pl-breakdown" style="margin-top:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;"></div>
            </div>
          </div>
          <div class="oz-chart-card oz-anim" style="animation-delay:0.12s">
            <div class="oz-chart-head">
              <div class="oz-chart-icon" style="background:#dbeafe;color:#3b82f6;">&#128202;</div>
              <div style="flex:1;">
                <div class="oz-chart-title">Monthly Sales vs Procurement</div>
                <div class="oz-chart-sub">Hover for details</div>
              </div>
            </div>
            <div id="oz-bar-chart" style="position:relative;min-height:240px;"></div>
            <div id="oz-bar-tooltip" class="oz-tip"></div>
          </div>
          <div class="oz-grid-2 oz-anim" style="animation-delay:0.16s">
            <div class="oz-chart-card" style="margin-bottom:0;">
              <div class="oz-chart-head">
                <div class="oz-chart-icon" style="background:#ede9fe;color:#7c3aed;">&#128230;</div>
                <div style="flex:1;">
                  <div class="oz-chart-title">Top Items by Revenue</div>
                  <div class="oz-chart-sub">Current period</div>
                </div>
              </div>
              <div id="oz-top-items"></div>
            </div>
            <div class="oz-chart-card" style="margin-bottom:0;">
              <div class="oz-chart-head">
                <div class="oz-chart-icon" style="background:#fef3c7;color:#d97706;">&#128101;</div>
                <div style="flex:1;">
                  <div class="oz-chart-title">Top Customers</div>
                  <div class="oz-chart-sub">Current period</div>
                </div>
              </div>
              <div id="oz-top-customers"></div>
            </div>
          </div>
          <div class="oz-chart-card oz-anim" style="animation-delay:0.2s">
            <div class="oz-chart-head">
              <div class="oz-chart-icon" style="background:#ecfeff;color:#0891b2;">&#127970;</div>
              <div>
                <div class="oz-chart-title">Company Comparison</div>
                <div class="oz-chart-sub">Sales vs Procurement vs Stock</div>
              </div>
            </div>
            <div id="oz-company-compare"></div>
          </div>
        </div>
        <div id="oz-panel-stock" class="oz-tab-panel" style="display:none;">
          <div class="oz-kpi-row oz-kpi-row-3 oz-anim" style="animation-delay:0.06s">
            <div class="oz-kpi-card">
              <div class="oz-kpi-icon" style="background:#ede9fe;color:#7c3aed;">&#128230;</div>
              <div class="oz-kpi-info">
                <div class="oz-kpi-val" id="oz-kpi-avail" style="color:#7c3aed;">--</div>
                <div class="oz-kpi-lbl">Available Stock</div>
              </div>
            </div>
            <div class="oz-kpi-card">
              <div class="oz-kpi-icon" style="background:#fef3c7;color:#d97706;">&#128274;</div>
              <div class="oz-kpi-info">
                <div class="oz-kpi-val" id="oz-kpi-reserved" style="color:#d97706;">--</div>
                <div class="oz-kpi-lbl">Swastik Reserved</div>
              </div>
            </div>
            <div class="oz-kpi-card">
              <div class="oz-kpi-icon" style="background:#fef2f2;color:#dc2626;">&#9888;</div>
              <div class="oz-kpi-info">
                <div class="oz-kpi-val" id="oz-kpi-neg" style="color:#dc2626;">--</div>
                <div class="oz-kpi-lbl">Negative Alerts</div>
              </div>
            </div>
          </div>
          <div class="oz-chart-card oz-anim" style="animation-delay:0.1s;padding:14px 18px;">
            <div style="display:flex;align-items:center;gap:16px;">
              <div style="flex:1;">
                <div style="font-size:11px;font-weight:700;color:#1e293b;margin-bottom:8px;">Stock Pipeline</div>
                <div id="oz-funnel-content"></div>
              </div>
              <div style="width:1px;height:80px;background:#f1f5f9;"></div>
              <div style="text-align:center;min-width:80px;">
                <div id="oz-ring" style="display:flex;justify-content:center;"></div>
                <div style="font-size:8px;font-weight:700;color:#94a3b8;margin-top:2px;">Utilization</div>
              </div>
              <div style="width:1px;height:80px;background:#f1f5f9;"></div>
              <div style="min-width:140px;">
                <div id="oz-mini-stats"></div>
              </div>
            </div>
          </div>
          <div class="oz-grid-2 oz-anim" style="animation-delay:0.14s">
            <div class="oz-chart-card" style="margin-bottom:0;">
              <div class="oz-chart-head">
                <div class="oz-chart-icon" style="background:#ede9fe;color:#7c3aed;">&#128161;</div>
                <div><div class="oz-chart-title">Stock Distribution</div><div class="oz-chart-sub">Hover segments for details</div></div>
              </div>
              <div id="oz-chart-donut"></div>
            </div>
            <div class="oz-chart-card" style="margin-bottom:0;">
              <div class="oz-chart-head">
                <div class="oz-chart-icon" style="background:#fef2f2;color:#dc2626;">&#9888;</div>
                <div style="flex:1;"><div class="oz-chart-title">Negative Stock Alerts</div></div>
              </div>
              <div id="oz-table-neg"></div>
            </div>
          </div>
          <div class="oz-chart-card oz-anim" style="animation-delay:0.18s">
            <div class="oz-chart-head">
              <div class="oz-chart-icon" style="background:#d1fae5;color:#059669;">&#127981;</div>
              <div><div class="oz-chart-title">Warehouse Stock Breakdown</div><div class="oz-chart-sub">All warehouses with stock</div></div>
            </div>
            <div id="oz-warehouse-table"></div>
          </div>
        </div>
        <div id="oz-panel-ict" class="oz-tab-panel" style="display:none;">
          <div class="oz-kpi-row oz-kpi-row-3 oz-anim" style="animation-delay:0.06s">
            <div class="oz-kpi-card">
              <div class="oz-kpi-icon" style="background:#cffafe;color:#0891b2;">&#128260;</div>
              <div class="oz-kpi-info">
                <div class="oz-kpi-val" id="oz-kpi-ict2" style="color:#0891b2;">--</div>
                <div class="oz-kpi-lbl">ICT Volume MTD</div>
              </div>
            </div>
            <div class="oz-kpi-card">
              <div class="oz-kpi-icon" style="background:#cffafe;color:#0891b2;">&#128203;</div>
              <div class="oz-kpi-info">
                <div class="oz-kpi-val" id="oz-kpi-ict-count" style="color:#0891b2;">--</div>
                <div class="oz-kpi-lbl">ICT Count MTD</div>
              </div>
            </div>
            <div class="oz-kpi-card">
              <div class="oz-kpi-icon" style="background:#cffafe;color:#0891b2;">&#128176;</div>
              <div class="oz-kpi-info">
                <div class="oz-kpi-val" id="oz-kpi-ict-val" style="color:#0891b2;">--</div>
                <div class="oz-kpi-lbl">ICT Value MTD</div>
              </div>
            </div>
          </div>
          <div class="oz-chart-card oz-anim" style="animation-delay:0.1s;">
            <div class="oz-chart-head">
              <div class="oz-chart-icon" style="background:#f0fdf4;color:#16a34a;">&#128256;</div>
              <div><div class="oz-chart-title">Routes Breakdown</div><div class="oz-chart-sub">Transfers between companies</div></div>
            </div>
            <div id="oz-routes-breakdown"></div>
          </div>
          <div class="oz-chart-card oz-anim" style="animation-delay:0.12s">
            <div class="oz-chart-head">
              <div class="oz-chart-icon" style="background:#cffafe;color:#0891b2;">&#128279;</div>
              <div style="flex:1;"><div class="oz-chart-title">ICT Chain Detail</div><div class="oz-chart-sub">Transfer items and status</div></div>
            </div>
            <div id="oz-ict-chain"></div>
          </div>
          <div class="oz-chart-card oz-anim" style="animation-delay:0.14s">
            <div class="oz-chart-head">
              <div class="oz-chart-icon" style="background:#cffafe;color:#0891b2;">&#128260;</div>
              <div style="flex:1;"><div class="oz-chart-title">Recent Transfers</div></div>
            </div>
            <div id="oz-table-ict"></div>
          </div>
          <div class="oz-chart-card oz-anim" style="animation-delay:0.18s">
            <div class="oz-chart-head">
              <div class="oz-chart-icon" style="background:#ede9fe;color:#7c3aed;">&#9729;</div>
              <div><div class="oz-chart-title">Activity Feed</div></div>
            </div>
            <div id="oz-activity"></div>
          </div>
        </div>
        <div id="oz-panel-reservations" class="oz-tab-panel" style="display:none;">
          <div class="oz-kpi-row oz-kpi-row-3 oz-anim" style="animation-delay:0.06s">
            <div class="oz-kpi-card">
              <div class="oz-kpi-icon" style="background:#fef3c7;color:#d97706;">&#128274;</div>
              <div class="oz-kpi-info">
                <div class="oz-kpi-val" id="oz-kpi-reserved2" style="color:#d97706;">--</div>
                <div class="oz-kpi-lbl">Active Reservations</div>
              </div>
            </div>
            <div class="oz-kpi-card">
              <div class="oz-kpi-icon" style="background:#ede9fe;color:#7c3aed;">&#128202;</div>
              <div class="oz-kpi-info">
                <div class="oz-kpi-val" id="oz-kpi-resqty" style="color:#7c3aed;">--</div>
                <div class="oz-kpi-lbl">Reserved Quantity</div>
              </div>
            </div>
            <div class="oz-kpi-card">
              <div class="oz-kpi-icon" style="background:#d1fae5;color:#059669;">&#128176;</div>
              <div class="oz-kpi-info">
                <div class="oz-kpi-val" id="oz-kpi-res-val" style="color:#059669;">--</div>
                <div class="oz-kpi-lbl">Reserved Value</div>
              </div>
            </div>
          </div>
          <div class="oz-kpi-row oz-kpi-row-3 oz-anim" style="animation-delay:0.08s">
            <div class="oz-kpi-card">
              <div class="oz-kpi-icon" style="background:#dbeafe;color:#3b82f6;">&#128230;</div>
              <div class="oz-kpi-info">
                <div class="oz-kpi-val" id="oz-kpi-res-items" style="color:#3b82f6;">--</div>
                <div class="oz-kpi-lbl">Reserved Items</div>
              </div>
            </div>
            <div class="oz-kpi-card">
              <div class="oz-kpi-icon" style="background:#fce7f3;color:#db2777;">&#128200;</div>
              <div class="oz-kpi-info">
                <div class="oz-kpi-val" id="oz-kpi-res-util" style="color:#db2777;">--</div>
                <div class="oz-kpi-lbl">Utilization</div>
              </div>
            </div>
            <div class="oz-kpi-card">
              <div class="oz-kpi-icon" style="background:#ecfeff;color:#0891b2;">&#127970;</div>
              <div class="oz-kpi-info">
                <div class="oz-kpi-val" id="oz-kpi-res-companies" style="color:#0891b2;">--</div>
                <div class="oz-kpi-lbl">Companies</div>
              </div>
            </div>
          </div>
          <div class="oz-chart-card oz-anim" style="animation-delay:0.1s">
            <div class="oz-chart-head">
              <div class="oz-chart-icon" style="background:#fef3c7;color:#d97706;">&#127970;</div>
              <div><div class="oz-chart-title">Reserved by Company</div><div class="oz-chart-sub">Stock reserved per company</div></div>
            </div>
            <div id="oz-res-by-company"></div>
          </div>
          <div class="oz-chart-card oz-anim" style="animation-delay:0.12s">
            <div class="oz-chart-head">
              <div class="oz-chart-icon" style="background:#fef3c7;color:#d97706;">&#128737;</div>
              <div style="flex:1;"><div class="oz-chart-title">Active Reservations</div><div class="oz-chart-sub">Swastik reserved stock</div></div>
            </div>
            <div id="oz-table-res"></div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style>
.oz { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; padding: 0 20px 20px; }
.oz * { box-sizing: border-box; }
.oz-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; box-shadow: 0 1px 3px rgba(0,20,40,0.04); }
.top-bars { position: sticky; top: 0; z-index: 50; background: #f0f4f8; border-radius: 14px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 6px; padding: 6px; }
.oz-bar { display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; flex-wrap: wrap; }
.oz-bar label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; display: flex; align-items: center; line-height: 1; margin: 0; }
.oz-filter-tag { font-size: 9px; font-weight: 700; padding: 3px 8px; border-radius: 6px; background: #eff6ff; color: #3b82f6; white-space: nowrap; }
.oz-tabs { display: flex; gap: 2px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 3px; width: fit-content; }
.oz-tab-btn { padding: 6px 16px; border-radius: 8px; border: none; background: transparent; font-size: 11px; font-weight: 700; cursor: pointer; color: #94a3b8; transition: all 0.2s; }
.oz-tab-btn:hover { color: #475569; background: #f8fafc; }
.oz-tab-active { background: #3b82f6 !important; color: #fff !important; }
.oz-period-bar { }
.oz-period-btn { padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 9px; font-weight: 700; cursor: pointer; color: #94a3b8; transition: all 0.2s; }
.oz-period-btn:hover { border-color: #3b82f6; color: #3b82f6; }
.oz-period-active { background: #3b82f6 !important; color: #fff !important; border-color: #3b82f6 !important; }
.oz-period-controls { display: flex; align-items: center; gap: 8px; margin-left: 16px; }
.oz-month-chip { padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 9px; font-weight: 700; cursor: pointer; color: #94a3b8; transition: all 0.2s; }
.oz-month-chip:hover { border-color: #3b82f6; color: #3b82f6; }
.oz-month-chip-active { background: #dbeafe !important; color: #3b82f6 !important; border-color: #3b82f6 !important; }
.oz-qtr-chip { padding: 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; font-size: 9px; font-weight: 700; cursor: pointer; color: #94a3b8; transition: all 0.2s; }
.oz-qtr-chip:hover { border-color: #3b82f6; color: #3b82f6; }
.oz-qtr-chip-active { background: #d1fae5 !important; color: #059669 !important; border-color: #059669 !important; }
.oz-kpi-row { display: grid; gap: 10px; margin-bottom: 14px; }
.oz-kpi-row-3 { grid-template-columns: repeat(3, 1fr); }
.oz-kpi-row-2 { grid-template-columns: repeat(2, 1fr); }
.oz-kpi-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 12px; }
.oz-kpi-card:hover { box-shadow: 0 4px 12px rgba(0,20,40,0.08); transform: translateY(-2px); }
.oz-kpi-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.oz-kpi-info { flex: 1; min-width: 0; }
.oz-kpi-val { font-size: 22px; font-weight: 800; line-height: 1.1; }
.oz-kpi-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-top: 1px; }
.oz-kpi-spark { margin-top: 3px; }
.oz-chart-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 14px; }
.oz-chart-head { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.oz-chart-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; }
.oz-chart-title { font-size: 12px; font-weight: 700; color: #1e293b; }
.oz-chart-sub { font-size: 9px; color: #94a3b8; }
.oz-table { width: 100%; border-collapse: collapse; font-size: 11px; }
.oz-table th { text-align: left; padding: 7px 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
.oz-table td { padding: 8px 10px; border-bottom: 1px solid #f8fafc; color: #475569; }
.oz-table tr { cursor: pointer; transition: background 0.15s; }
.oz-table tr:hover { background: #f1f5f9; }
.oz-cs { position: relative; display: inline-block; }
.oz-cs-btn { display: flex; align-items: center; gap: 6px; padding: 4px 24px 4px 10px; border-radius: 6px; border: 1px solid #e2e8f0; background: #f8fafc; color: #64748b; font-size: 9px; font-weight: 700; cursor: pointer; min-width: 80px; white-space: nowrap; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%2394a3b8'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; transition: all 0.2s; }
.oz-cs-btn:hover { border-color: #3b82f6; color: #3b82f6; background-color: #fff; }
.oz-cs-btn.oz-cs-open { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); background-color: #fff; color: #1e293b; }
.oz-cs-panel { display: none; position: fixed; z-index: 9999; min-width: 140px; max-height: 240px; overflow-y: auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,20,40,0.12); padding: 4px; }
.oz-cs-panel.oz-cs-show { display: block; }
.oz-cs-opt { display: flex; align-items: center; padding: 6px 10px; border-radius: 6px; cursor: pointer; transition: background 0.1s; font-size: 10px; font-weight: 600; color: #475569; }
.oz-cs-opt:hover { background: #f1f5f9; color: #1e293b; }
.oz-cs-opt.oz-cs-selected { background: #eff6ff; color: #3b82f6; font-weight: 700; }
.oz-period-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
.oz-badge { display: inline-block; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 20px; }
.oz-link { font-size: 10px; font-weight: 600; color: #3b82f6; cursor: pointer; text-decoration: none; }
.oz-link:hover { text-decoration: underline; }
.oz-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
.oz-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 14px; }
.oz-grid-6-4 { display: grid; grid-template-columns: 6fr 4fr; gap: 12px; margin-bottom: 14px; }
.oz-grid-4-6 { display: grid; grid-template-columns: 4fr 6fr; gap: 12px; margin-bottom: 14px; }
.oz-grid-7-3 { display: grid; grid-template-columns: 7fr 3fr; gap: 12px; margin-bottom: 14px; }
.oz-funnel-bar { height: 6px; border-radius: 6px; background: #f1f5f9; overflow: hidden; }
.oz-funnel-fill { height: 100%; border-radius: 6px; transition: width 0.8s cubic-bezier(0.22,1,0.36,1); }
.oz-tl { position: relative; padding-left: 14px; }
.oz-tl::before { content: ''; position: absolute; left: 5px; top: 4px; bottom: 4px; width: 1px; background: linear-gradient(to bottom, #cbd5e1, transparent); }
.oz-tl-item { display: flex; gap: 8px; padding: 5px 4px; border-radius: 6px; margin-bottom: 2px; cursor: pointer; transition: all 0.15s; }
.oz-tl-item:hover { background: #f1f5f9; }
.oz-tl-dot { width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 10px; position: relative; z-index: 1; }
.oz-tip { position: fixed; background: #1e293b; color: #fff; padding: 10px 14px; border-radius: 10px; font-size: 10px; pointer-events: none; z-index: 9999; white-space: nowrap; box-shadow: 0 12px 32px rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); opacity: 0; transition: opacity 0.15s; }
.oz-tip.show { opacity: 1; }
.oz-prog { height: 4px; border-radius: 4px; background: #f1f5f9; overflow: hidden; }
.oz-prog-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
.oz-rank { width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; flex-shrink: 0; }
.oz-chain { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; padding: 8px 0; }
.oz-chain-step { padding: 4px 8px; border-radius: 6px; font-size: 9px; font-weight: 700; background: #f1f5f9; color: #64748b; }
.oz-chain-active { background: #dbeafe; color: #3b82f6; }
.oz-chain-arrow { color: #cbd5e1; font-size: 10px; }
.oz-spark { display: inline-block; vertical-align: middle; }
@keyframes ozFadeIn { 0%{opacity:0;transform:translateY(8px);}100%{opacity:1;transform:translateY(0);} }
.oz-anim { animation: ozFadeIn 0.35s ease both; }
.oz-ms { position: relative; display: inline-block; }
.oz-ms-btn { display: flex; align-items: center; gap: 6px; padding: 5px 28px 5px 10px; border-radius: 7px; border: 1px solid #e2e8f0; background: #f8fafc; color: #334155; font-size: 11px; font-weight: 600; cursor: pointer; min-width: 120px; white-space: nowrap; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%2394a3b8'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; transition: border-color 0.2s; }
.oz-ms-btn:hover { border-color: #cbd5e1; }
.oz-ms-btn.oz-ms-open { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.oz-ms-btn .oz-ms-count { background: #059669; color: #fff; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 10px; }
.oz-ms-panel { display: none; position: fixed; z-index: 9999; min-width: 220px; max-height: 280px; overflow-y: auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,20,40,0.12); padding: 6px; }
.oz-ms-panel.oz-ms-show { display: block; }
.oz-ms-search { width: 100%; padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; outline: none; margin-bottom: 4px; }
.oz-ms-search:focus { border-color: #3b82f6; }
.oz-ms-actions { display: flex; gap: 4px; padding: 4px 0; border-bottom: 1px solid #f1f5f9; margin-bottom: 4px; }
.oz-ms-action { padding: 3px 8px; border-radius: 5px; border: none; background: transparent; font-size: 9px; font-weight: 700; cursor: pointer; color: #3b82f6; }
.oz-ms-action:hover { background: #eff6ff; }
.oz-ms-opt { display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 6px; cursor: pointer; transition: background 0.1s; }
.oz-ms-opt:hover { background: #f1f5f9; }
.oz-ms-opt input[type="checkbox"] { accent-color: #3b82f6; width: 14px; height: 14px; cursor: pointer; }
.oz-ms-opt-label { font-size: 11px; font-weight: 600; color: #334155; flex: 1; }
.oz-ms-opt-abbr { font-size: 9px; font-weight: 700; color: #94a3b8; }
</style>

<script setup>
import { onMounted, nextTick } from "vue"
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonContent, IonMenuButton } from "@ionic/vue"
import { frappeRequest } from "frappe-ui"

if (!window.frappe) window.frappe = {}
if (!window.frappe.set_route) window.frappe.set_route = function () {}
if (!window.frappe.datetime) window.frappe.datetime = { str_to_user: function (d) { return d || "" } }

const _now = new Date()
const _curM = _now.getMonth()
const _curYr = _now.getFullYear()
const _curFYStart = _curM >= 3 ? _curYr : _curYr - 1
const _curFYValue = _curFYStart + "-04-01_" + (_curFYStart + 1) + "-03-31"

const ozState = {
  company: "All", item: "All", period: "MTD", months: 6,
  fy: _curFYValue, tab: "sales",
  selected_months: [], selected_qtrs: [1], selected_ytd_fys: [],
  compare_month: "", compare_qtr: "", compare_fy: "",
  kpi_data: {}, item_options: [],
}

const fyOptions = []
for (let i = 0; i < 5; i++) {
  const sy = _curFYStart - i, ey = sy + 1
  fyOptions.push({ value: sy + "-04-01_" + ey + "-03-31", label: "FY " + sy + "-" + String(ey).slice(-2), abbr: sy + "-" + ey })
}

const A = "\u20B9", U = "\u2191", D = "\u2193"

function oz_k(v) { v = parseFloat(v) || 0; if (Math.abs(v) >= 1000) return A + (v / 1000).toFixed(1) + "K"; return A + v.toFixed(0) }
function oz_n(v) { v = parseFloat(v) || 0; if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + "K"; return v.toFixed(0) }

function oz_count(el, target, pre, suf, dur) {
  if (!el) return; pre = pre || ""; suf = suf || ""; dur = dur || 1200
  let start = null
  function step(ts) { if (!start) start = ts; const p = Math.min((ts - start) / dur, 1); const e = 1 - Math.pow(1 - p, 3); el.textContent = pre + Math.floor(e * target).toLocaleString() + suf; if (p < 1) requestAnimationFrame(step) }
  requestAnimationFrame(step)
}

function oz_sparkline(el, values, color) {
  if (!el) return
  if (!values || values.length < 2) { el.innerHTML = ""; return }
  const w = 80, h = 18, p = 2
  const mx = Math.max.apply(null, values) || 1
  const pts = values.map((v, i) => ({ x: p + (i / (values.length - 1)) * (w - 2 * p), y: p + (h - 2 * p) - (v / mx) * (h - 2 * p) }))
  const path = pts.map((q, i) => (i === 0 ? "M" : "L") + " " + q.x.toFixed(1) + " " + q.y.toFixed(1)).join(" ")
  const area = path + " L " + pts[pts.length - 1].x.toFixed(1) + " " + (h - p) + " L " + pts[0].x.toFixed(1) + " " + (h - p) + " Z"
  const gid = "sp-" + Math.random().toString(36).substr(2, 6)
  let s = '<svg viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" class="oz-spark">'
  s += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + color + '" stop-opacity="0.3"/><stop offset="100%" stop-color="' + color + '" stop-opacity="0.05"/></linearGradient></defs>'
  s += '<path d="' + area + '" fill="url(#' + gid + ')"/>'
  s += '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linecap="round"/>'
  s += '<circle cx="' + pts[pts.length - 1].x.toFixed(1) + '" cy="' + pts[pts.length - 1].y.toFixed(1) + '" r="2.5" fill="' + color + '"/>'
  s += "</svg>"; el.innerHTML = s
}

function oz_sparkline_with_pct(el, values, color, prevVal) {
  if (!el) return
  if (!values || values.length < 2) { el.innerHTML = ""; return }
  const w = 60, h = 18, p = 2
  const mx = Math.max.apply(null, values) || 1
  const pts = values.map((v, i) => ({ x: p + (i / (values.length - 1)) * (w - 2 * p), y: p + (h - 2 * p) - (v / mx) * (h - 2 * p) }))
  const path = pts.map((q, i) => (i === 0 ? "M" : "L") + " " + q.x.toFixed(1) + " " + q.y.toFixed(1)).join(" ")
  const area = path + " L " + pts[pts.length - 1].x.toFixed(1) + " " + (h - p) + " L " + pts[0].x.toFixed(1) + " " + (h - p) + " Z"
  const gid = "sp-" + Math.random().toString(36).substr(2, 6)
  let s = '<svg viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" class="oz-spark">'
  s += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + color + '" stop-opacity="0.3"/><stop offset="100%" stop-color="' + color + '" stop-opacity="0.05"/></linearGradient></defs>'
  s += '<path d="' + area + '" fill="url(#' + gid + ')"/>'
  s += '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linecap="round"/>'
  s += '<circle cx="' + pts[pts.length - 1].x.toFixed(1) + '" cy="' + pts[pts.length - 1].y.toFixed(1) + '" r="2.5" fill="' + color + '"/>'
  s += "</svg>"
  if (prevVal !== null && prevVal !== undefined && prevVal !== 0) {
    const currVal = values[values.length - 1]
    let change = ((currVal - prevVal) / Math.abs(prevVal)) * 100
    change = Math.max(-999, Math.min(999, change))
    const cr = Math.round(change * 10) / 10
    const pc = cr >= 0 ? "#059669" : "#dc2626"
    const ar = cr >= 0 ? U : D
    s += '<span style="font-size:9px;font-weight:700;color:' + pc + ';margin-left:4px;white-space:nowrap;">' + (cr >= 0 ? "+" : "") + cr + "%" + ar + "</span>"
  }
  el.innerHTML = s
}

function oz_ring(el, pct, c1, c2, sz) {
  if (!el) return; sz = sz || 100; pct = Math.min(100, Math.max(0, pct))
  const r = (sz - 10) / 2, circ = 2 * Math.PI * r, ct = sz / 2
  let s = '<div style="position:relative;width:' + sz + "px;height:" + sz + 'px;">'
  s += '<svg viewBox="0 0 ' + sz + " " + sz + '" width="' + sz + '" height="' + sz + '" style="transform:rotate(-90deg);">'
  s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="#f1f5f9" stroke-width="7"/>'
  s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="url(#oring)" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + (circ * pct / 100) + " " + (circ * (1 - pct / 100)) + '"/>'
  s += '<defs><linearGradient id="oring"><stop offset="0%" stop-color="' + (c1 || "#3b82f6") + '"/><stop offset="100%" stop-color="' + (c2 || "#7c3aed") + '"/></linearGradient></defs>'
  s += "</svg>"
  s += '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;"><span style="font-size:20px;font-weight:800;color:#1e293b;">' + Math.round(pct) + "%</span></div></div>"
  el.innerHTML = s
}

function oz_build_stacked_bar(container, tooltip, labels, sales, purchase, variance, variance_change) {
  if (!container) return
  if (!labels || !labels.length) { container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;">No data</div>'; return }
  const containerW = container.offsetWidth || 700
  const W = Math.max(containerW, 400), H = 260, P = { t: 20, r: 20, b: 50, l: 55 }
  const cw = W - P.l - P.r, ch = H - P.t - P.b
  const n = labels.length, groupW = cw / n
  const barW = Math.min(groupW * 0.5, Math.max(20, Math.min(40, cw / n * 0.4)))
  const totals = []; for (let i = 0; i < n; i++) totals.push((sales[i] || 0) + (purchase[i] || 0))
  let mx = Math.max.apply(null, totals) * 1.15 || 1
  let varMin = 0, varMax = 0
  if (variance && variance.length) {
    varMin = Math.min.apply(null, variance); varMax = Math.max.apply(null, variance)
    const range = Math.max(Math.abs(varMin), Math.abs(varMax)) * 1.2 || 1; varMin = -range; varMax = range
  }
  const yScale = v => P.t + ch - (v / mx) * ch
  const varScale = v => P.t + ch - ((v - varMin) / (varMax - varMin || 1)) * ch
  let s = '<svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;height:' + H + 'px;">'
  s += "<defs><filter id=\"barShadow\"><feDropShadow dx=\"0\" dy=\"1\" stdDeviation=\"2\" flood-opacity=\"0.1\"/></filter>"
  s += '<linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#2563eb"/></linearGradient>'
  s += '<linearGradient id="procGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#10b981"/><stop offset="100%" stop-color="#059669"/></linearGradient></defs>'
  for (let g = 0; g <= 5; g++) {
    const gy = P.t + (g / 5) * ch, val = Math.round(mx * (1 - g / 5))
    s += '<line x1="' + P.l + '" y1="' + gy + '" x2="' + (W - P.r) + '" y2="' + gy + '" stroke="#e2e8f0" stroke-width="0.5"/>'
    s += '<text x="' + (P.l - 8) + '" y="' + (gy + 3) + '" text-anchor="end" fill="#94a3b8" font-size="8" font-weight="600">' + oz_k(val) + "</text>"
  }
  labels.forEach((l, i) => {
    const cx = P.l + i * groupW + groupW / 2
    const sv = sales[i] || 0, pv = purchase[i] || 0
    const sh = Math.max(1, (sv / mx) * ch), ph = Math.max(1, (pv / mx) * ch)
    const salesY = P.t + ch - sh
    s += '<g class="oz-bar-group" data-idx="' + i + '" data-type="sales">'
    s += '<rect x="' + (cx - barW / 2) + '" y="' + salesY + '" width="' + barW + '" height="' + sh + '" rx="0" fill="url(#salesGrad)" opacity="0.9" filter="url(#barShadow)" style="transition:opacity 0.15s;cursor:pointer;"/>'
    s += '<rect x="' + (cx - barW / 2) + '" y="' + P.t + '" width="' + barW + '" height="' + ch + '" fill="transparent" style="cursor:pointer;"/></g>'
    const procY = salesY - ph
    s += '<g class="oz-bar-group" data-idx="' + i + '" data-type="purchase">'
    s += '<rect x="' + (cx - barW / 2) + '" y="' + procY + '" width="' + barW + '" height="' + ph + '" rx="3" fill="url(#procGrad)" opacity="0.9" filter="url(#barShadow)" style="transition:opacity 0.15s;cursor:pointer;"/>'
    s += '<rect x="' + (cx - barW / 2) + '" y="' + P.t + '" width="' + barW + '" height="' + ch + '" fill="transparent" style="cursor:pointer;"/></g>'
    s += '<text x="' + cx + '" y="' + (H - 28) + '" text-anchor="middle" fill="#64748b" font-size="9" font-weight="700">' + l + "</text>"
    if (variance && variance[i] !== undefined) {
      const vY = varScale(variance[i]), vColor = variance[i] >= 0 ? "#059669" : "#dc2626"
      const vPct = sv > 0 ? ((variance[i] / sv) * 100).toFixed(1) : "0.0"
      if (i === 0) { const zeroY = varScale(0); s += '<line x1="' + P.l + '" y1="' + zeroY + '" x2="' + (W - P.r) + '" y2="' + zeroY + '" stroke="#94a3b8" stroke-width="0.5" stroke-dasharray="4,4"/>' }
      s += '<circle cx="' + cx + '" cy="' + vY + '" r="4" fill="' + vColor + '" opacity="0.9" filter="url(#barShadow)"><title>Variance: ' + (variance[i] >= 0 ? "+" : "") + oz_k(variance[i]) + " (" + vPct + "%)</title></circle>"
      if (i > 0 && variance[i - 1] !== undefined) {
        const prevX = P.l + (i - 1) * groupW + groupW / 2, prevY = varScale(variance[i - 1])
        s += '<line x1="' + prevX + '" y1="' + prevY + '" x2="' + cx + '" y2="' + vY + '" stroke="' + vColor + '" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.5"/>'
      }
      if (variance_change && variance_change[i] !== null && variance_change[i] !== undefined) {
        const change = variance_change[i], changeColor = change >= 0 ? "#059669" : "#dc2626", changeArrow = change >= 0 ? "\u2191" : "\u2193"
        s += '<text x="' + cx + '" y="' + (H - 14) + '" text-anchor="middle" fill="' + changeColor + '" font-size="8" font-weight="700">' + (change >= 0 ? "+" : "") + change + "%" + changeArrow + "</text>"
      } else { s += '<text x="' + cx + '" y="' + (H - 14) + '" text-anchor="middle" fill="#94a3b8" font-size="8" font-weight="600">N/A</text>' }
    }
    s += '<text x="' + cx + '" y="' + (procY - 5) + '" text-anchor="middle" fill="#1e293b" font-size="7" font-weight="700">' + oz_k(sv + pv) + "</text>"
  })
  s += "</svg>"
  s += '<div style="display:flex;gap:16px;justify-content:center;margin-top:8px;">'
  s += '<div style="display:flex;align-items:center;gap:5px;"><div style="width:10px;height:10px;border-radius:3px;background:#3b82f6;"></div><span style="font-size:10px;font-weight:600;color:#64748b;">Sales</span></div>'
  s += '<div style="display:flex;align-items:center;gap:5px;"><div style="width:10px;height:10px;border-radius:3px;background:#10b981;"></div><span style="font-size:10px;font-weight:600;color:#64748b;">Procurement</span></div>'
  s += '<div style="display:flex;align-items:center;gap:5px;"><div style="width:10px;height:10px;border-radius:50%;background:#059669;"></div><span style="font-size:10px;font-weight:600;color:#64748b;">Variance</span></div></div>'
  container.innerHTML = s
  if (!tooltip) return
  container.querySelectorAll(".oz-bar-group").forEach(g => {
    g.addEventListener("mouseenter", () => {
      const idx = parseInt(g.getAttribute("data-idx")), sv2 = sales[idx] || 0, pv2 = purchase[idx] || 0
      const v = variance && variance[idx] !== undefined ? variance[idx] : sv2 - pv2
      const vPct2 = sv2 > 0 ? ((v / sv2) * 100).toFixed(1) : "0.0", vColor2 = v >= 0 ? "#059669" : "#dc2626"
      tooltip.innerHTML = '<div style="font-size:10px;font-weight:700;color:#1e293b;margin-bottom:4px;">' + labels[idx] + "</div>" +
        '<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;"><div style="width:6px;height:6px;border-radius:2px;background:#3b82f6;"></div><span style="font-size:9px;color:#64748b;">Sales</span><span style="font-size:10px;font-weight:700;color:#3b82f6;margin-left:auto;">' + oz_k(sv2) + "</span></div>" +
        '<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px;"><div style="width:6px;height:6px;border-radius:2px;background:#10b981;"></div><span style="font-size:9px;color:#64748b;">Procurement</span><span style="font-size:10px;font-weight:700;color:#10b981;margin-left:auto;">' + oz_k(pv2) + "</span></div>" +
        '<div style="border-top:1px solid #e2e8f0;margin-top:3px;padding-top:3px;display:flex;align-items:center;gap:5px;"><div style="width:6px;height:6px;border-radius:50%;background:' + vColor2 + ';"></div><span style="font-size:9px;color:#64748b;">Variance</span><span style="font-size:10px;font-weight:700;color:' + vColor2 + ';margin-left:auto;">' + (v >= 0 ? "+" : "") + oz_k(v) + " (" + vPct2 + "%)</span></div>"
      if (variance_change && variance_change[idx] !== null && variance_change[idx] !== undefined) {
        const ch2 = variance_change[idx], chC = ch2 >= 0 ? "#059669" : "#dc2626", chA = ch2 >= 0 ? "\u2191" : "\u2193"
        tooltip.innerHTML += '<div style="display:flex;align-items:center;gap:5px;margin-top:3px;"><span style="font-size:9px;color:#94a3b8;">vs Previous</span><span style="font-size:10px;font-weight:700;color:' + chC + ';margin-left:auto;">' + (ch2 >= 0 ? "+" : "") + ch2 + "% " + chA + "</span></div>"
      } else { tooltip.innerHTML += '<div style="display:flex;align-items:center;gap:5px;margin-top:3px;"><span style="font-size:9px;color:#94a3b8;">vs Previous</span><span style="font-size:10px;font-weight:700;color:#94a3b8;margin-left:auto;">N/A</span></div>' }
      const rect = g.getBoundingClientRect(); tooltip.style.left = (rect.left + rect.width / 2) + "px"; tooltip.style.top = (rect.top - 12) + "px"; tooltip.style.transform = "translateX(-50%) translateY(-100%)"; tooltip.classList.add("show")
    })
    g.addEventListener("mouseleave", () => { tooltip.classList.remove("show") })
  })
}

function oz_donut(el, data, size) {
  if (!el) return; size = size || 160
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) { el.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;">No data</div>'; return }
  const r = (size - 20) / 2, circ = 2 * Math.PI * r, ct = size / 2
  let cum = 0
  const uid = "donut-" + Math.random().toString(36).substr(2, 6)
  const segs = data.map(item => { const pct = item.value / total; const seg = { label: item.label, value: item.value, color: item.color, pct, cum }; cum += pct; return seg })
  let s = '<div style="display:flex;align-items:center;gap:20px;justify-content:center;">'
  s += '<div style="position:relative;width:' + size + "px;height:" + size + 'px;">'
  s += '<svg width="' + size + '" height="' + size + '" style="transform:rotate(-90deg);" id="' + uid + '-svg">'
  s += '<circle cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="#f1f5f9" stroke-width="20"/>'
  const gapPct = 0.015
  segs.forEach((seg, i) => { const adj = Math.max(0, seg.pct - gapPct); const dash = circ * adj; const offset = -circ * seg.cum
    s += '<circle class="oz-donut-seg" data-idx="' + i + '" cx="' + ct + '" cy="' + ct + '" r="' + r + '" fill="none" stroke="' + seg.color + '" stroke-width="20" stroke-dasharray="' + dash + " " + (circ - dash) + '" stroke-dashoffset="' + offset + '" stroke-linecap="round" style="transition:stroke-width 0.2s, opacity 0.2s;cursor:pointer;">'
    s += "<title>" + seg.label + ": " + oz_n(seg.value) + " (" + Math.round(seg.pct * 100) + "%)</title></circle>" })
  s += "</svg>"
  s += '<div id="' + uid + '-center" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">'
  s += '<span style="font-size:22px;font-weight:800;color:#1e293b;">' + total.toLocaleString() + '</span><span style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">Total</span></div></div>'
  s += '<div id="' + uid + '-legend" style="display:flex;flex-direction:column;gap:6px;">'
  segs.forEach((seg, i) => { const pctStr = Math.round(seg.pct * 100) + "%"
    s += '<div class="oz-donut-leg" data-idx="' + i + '" style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:6px;cursor:pointer;transition:all 0.15s;border:1px solid transparent;">'
    s += '<div style="width:10px;height:10px;border-radius:3px;background:' + seg.color + ';flex-shrink:0;"></div>'
    s += '<div style="flex:1;min-width:0;"><div style="font-size:10px;font-weight:700;color:#1e293b;">' + seg.label + '</div><div style="font-size:9px;color:#94a3b8;">' + oz_n(seg.value) + " (" + pctStr + ")</div></div>"
    s += '<div style="width:40px;height:4px;border-radius:4px;background:#f1f5f9;overflow:hidden;"><div style="height:100%;width:' + (seg.pct * 100) + "%;background:" + seg.color + ';border-radius:4px;"></div></div></div>' })
  s += "</div></div>"
  el.innerHTML = s
  const svg = document.getElementById(uid + "-svg"), legend = document.getElementById(uid + "-legend"), center = document.getElementById(uid + "-center")
  if (!svg || !legend || !center) return
  const segs_el = svg.querySelectorAll(".oz-donut-seg"), leg_items = legend.querySelectorAll(".oz-donut-leg")
  function highlight(idx) {
    segs_el.forEach((c, i) => { if (idx === null) { c.style.strokeWidth = "20"; c.style.opacity = "1" } else if (i === idx) { c.style.strokeWidth = "26"; c.style.opacity = "1" } else { c.style.strokeWidth = "16"; c.style.opacity = "0.35" } })
    leg_items.forEach((l, i) => { if (idx === null) { l.style.borderColor = "transparent"; l.style.background = "transparent" } else if (i === idx) { l.style.borderColor = segs[i].color; l.style.background = segs[i].color + "08" } else { l.style.borderColor = "transparent"; l.style.background = "transparent" } })
    if (idx !== null) { center.innerHTML = '<span style="font-size:20px;font-weight:800;color:' + segs[idx].color + ';">' + Math.round(segs[idx].pct * 100) + '%</span><span style="font-size:8px;font-weight:700;color:#94a3b8;">' + segs[idx].label + "</span>" }
    else { center.innerHTML = '<span style="font-size:22px;font-weight:800;color:#1e293b;">' + total.toLocaleString() + '</span><span style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#94a3b8;">Total</span>' }
  }
  segs_el.forEach(c => { c.addEventListener("mouseenter", function () { highlight(parseInt(this.getAttribute("data-idx"))) }); c.addEventListener("mouseleave", () => highlight(null)) })
  leg_items.forEach(l => { l.addEventListener("mouseenter", function () { highlight(parseInt(this.getAttribute("data-idx"))) }); l.addEventListener("mouseleave", () => highlight(null)) })
}

function oz_init_multi(containerId, options, onChange, defaultSelected) {
  const container = document.getElementById(containerId); if (!container) return
  container._selected = defaultSelected || options.map(o => o.value)
  container._options = options; container._onChange = onChange
  const btn = document.createElement("div"); btn.className = "oz-ms-btn"; btn.textContent = "All"; container.appendChild(btn)
  const panel = document.createElement("div"); panel.className = "oz-ms-panel"; panel._container = container
  document.body.appendChild(panel); container._panel = panel
  document.addEventListener("click", e => { if (!container.contains(e.target) && !panel.contains(e.target)) { panel.classList.remove("oz-ms-show"); btn.classList.remove("oz-ms-open") } })
  btn.addEventListener("click", e => {
    e.stopPropagation(); const isOpen = panel.classList.contains("oz-ms-show")
    document.querySelectorAll(".oz-ms-panel").forEach(p => p.classList.remove("oz-ms-show"))
    document.querySelectorAll(".oz-ms-btn").forEach(b => b.classList.remove("oz-ms-open"))
    if (!isOpen) { panel.classList.add("oz-ms-show"); btn.classList.add("oz-ms-open")
      const rect = btn.getBoundingClientRect(); panel.style.left = rect.left + "px"; panel.style.top = (rect.bottom + 4) + "px"; oz_render_ms_panel(container) }
  })
  oz_render_ms_panel(container); oz_update_ms_btn(container)
}

function oz_render_ms_panel(container) {
  const panel = container._panel; if (!panel) return
  const options = container._options || [], selected = container._selected
  let html = '<input class="oz-ms-search" type="text" placeholder="Search...">'
  html += '<div class="oz-ms-actions"><button class="oz-ms-action" data-action="all">Select All</button><button class="oz-ms-action" data-action="clear">Clear</button></div>'
  html += '<div class="oz-ms-error" style="display:none;text-align:center;padding:8px;color:#dc2626;font-size:10px;font-weight:600;">Select at least one element</div>'
  options.forEach(opt => { const checked = selected.indexOf(opt.value) !== -1 ? "checked" : ""
    const label = opt.label || opt.value, abbr = opt.abbr ? '<span class="oz-ms-opt-abbr">' + opt.abbr + "</span>" : ""
    html += '<label class="oz-ms-opt"><input type="checkbox" value="' + opt.value + '" ' + checked + '><span class="oz-ms-opt-label">' + label + "</span>" + abbr + "</label>" })
  if (options.length === 0) html += '<div style="text-align:center;padding:12px;color:#94a3b8;font-size:10px;">Loading...</div>'
  panel.innerHTML = html
  panel.querySelector(".oz-ms-search").addEventListener("input", function () {
    const q = this.value.toLowerCase(); panel.querySelectorAll(".oz-ms-opt").forEach(opt => {
      const lbl = opt.querySelector(".oz-ms-opt-label").textContent.toLowerCase(); opt.style.display = lbl.indexOf(q) !== -1 ? "" : "none" }) })
  panel.querySelectorAll(".oz-ms-action").forEach(actBtn => {
    actBtn.addEventListener("click", e => { e.preventDefault(); e.stopPropagation()
      if (actBtn.getAttribute("data-action") === "all") { container._selected = container._options.map(o => o.value) }
      else { if (container._selected.length <= 1) { const errEl = panel.querySelector(".oz-ms-error"); if (errEl) { errEl.style.display = "block"; setTimeout(() => errEl.style.display = "none", 2000) } return } container._selected = [container._selected[0]] }
      oz_update_ms_btn(container); oz_render_ms_panel(container); if (container._onChange) container._onChange(container._selected) }) })
  panel.querySelectorAll('.oz-ms-opt input[type="checkbox"]').forEach(cb => {
    cb.addEventListener("change", function () { const val = this.value
      if (this.checked) { if (container._selected.indexOf(val) === -1) container._selected.push(val) }
      else { if (container._selected.length <= 1) { this.checked = true; const lbl = this.closest(".oz-ms-opt"); if (lbl) { lbl.style.background = "#fee2e2"; setTimeout(() => lbl.style.background = "", 1200) } return } container._selected = container._selected.filter(v => v !== val) }
      oz_update_ms_btn(container); oz_render_ms_panel(container); if (container._onChange) container._onChange(container._selected) }) })
}

function oz_update_ms_btn(container) {
  const btn = container.querySelector(".oz-ms-btn"); if (!btn) return
  const sel = container._selected, opts = container._options || []
  if (sel.length === 0 || sel.length === opts.length) { btn.innerHTML = "All" }
  else if (sel.length === 1) { const opt = opts.find(o => o.value === sel[0]); const label = opt ? (opt.abbr || opt.label || sel[0]) : sel[0]; btn.innerHTML = label + ' <span class="oz-ms-count">' + sel.length + "</span>" }
  else { btn.innerHTML = "Selected " + sel.length + ' <span class="oz-ms-count">' + sel.length + "</span>" }
}

function oz_update_options(containerId, options) {
  const container = document.getElementById(containerId); if (!container) return
  container._options = options; container._selected = options.map(o => o.value)
  oz_update_ms_btn(container); oz_render_ms_panel(container); if (container._onChange) container._onChange(container._selected)
}

function oz_init_compare(containerId, options, onChange, defaultVal) {
  const container = document.getElementById(containerId); if (!container) return
  container._options = options || []; container._value = defaultVal || ""; container._onChange = onChange
  const btn = document.createElement("div"); btn.className = "oz-cs-btn"; container.appendChild(btn)
  const panel = document.createElement("div"); panel.className = "oz-cs-panel"; panel._container = container
  document.body.appendChild(panel); container._panel = panel
  document.addEventListener("click", e => { if (!container.contains(e.target) && !panel.contains(e.target)) { panel.classList.remove("oz-cs-show"); btn.classList.remove("oz-cs-open") } })
  btn.addEventListener("click", e => {
    e.stopPropagation(); const isOpen = panel.classList.contains("oz-cs-show")
    document.querySelectorAll(".oz-cs-panel").forEach(p => p.classList.remove("oz-cs-show"))
    document.querySelectorAll(".oz-cs-btn").forEach(b => b.classList.remove("oz-cs-open"))
    if (!isOpen) { panel.classList.add("oz-cs-show"); btn.classList.add("oz-cs-open")
      const rect = btn.getBoundingClientRect(); panel.style.left = rect.left + "px"; panel.style.top = (rect.bottom + 4) + "px" }
  })
  oz_render_cs_panel(container)
}

function oz_render_cs_panel(container) {
  const panel = container._panel, btn = container.querySelector(".oz-cs-btn")
  if (!panel || !btn) return; const options = container._options || [], value = container._value
  const selectedOpt = options.find(o => o.value === value); btn.textContent = selectedOpt ? selectedOpt.label : "None"
  let html = '<div class="oz-cs-opt' + (value === "" ? " oz-cs-selected" : "") + '" data-value="">None</div>'
  options.forEach(opt => { const cls = opt.value === value ? " oz-cs-selected" : ""; html += '<div class="oz-cs-opt' + cls + '" data-value="' + opt.value + '">' + opt.label + "</div>" })
  panel.innerHTML = html
  panel.querySelectorAll(".oz-cs-opt").forEach(el => { el.addEventListener("click", function () {
    container._value = this.getAttribute("data-value"); oz_render_cs_panel(container)
    panel.classList.remove("oz-cs-show"); btn.classList.remove("oz-cs-open")
    if (container._onChange) container._onChange(container._value) }) })
}

function oz_set_compare(containerId, value) {
  const container = document.getElementById(containerId); if (!container) return
  container._value = value || ""; oz_render_cs_panel(container)
}

function oz_update_filter_tag() {
  const co = ozState.company, fy = ozState.fy
  const coTag = document.getElementById("oz-filter-company")
  if (coTag) { if (co === "All") { coTag.textContent = "All Companies"; coTag.style.background = "#eff6ff"; coTag.style.color = "#3b82f6" }
    else { const coLabel = co.split(",").map(c => { const m = { "Geeta Enterprise": "GE", "Global Export": "GEX", "Shubham Enterprise": "SHE" }; return m[c] || c }).join(", ")
      coTag.textContent = coLabel; coTag.style.background = "#ecfdf5"; coTag.style.color = "#059669" } }
  const fyTag = document.getElementById("oz-filter-fy")
  if (fyTag) { if (fy === "All") { fyTag.textContent = "All FY"; fyTag.style.background = "#eff6ff"; fyTag.style.color = "#3b82f6" }
    else { const fyLabel = fy.split(",").map(f => { const parts = f.split("_"); if (parts.length === 2) { const sy = parts[0].split("-")[0], ey = parts[1].split("-")[0]; return "FY " + sy + "-" + String(ey).slice(-2) } return f }).join(", ")
      fyTag.textContent = fyLabel; fyTag.style.background = "#fef3c7"; fyTag.style.color = "#d97706" } }
}

function oz_render_month_chips() {
  const months = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"]
  const container = document.getElementById("oz-month-chips"); if (!container) return
  let html = ""
  months.forEach((m, i) => { const active = ozState.selected_months.indexOf(i) !== -1 ? "oz-month-chip-active" : ""; html += '<span class="oz-month-chip ' + active + '" data-idx="' + i + '">' + m + "</span>" })
  container.innerHTML = html
  container.querySelectorAll(".oz-month-chip").forEach(chip => { chip.addEventListener("click", function () {
    const idx = parseInt(this.getAttribute("data-idx")), pos = ozState.selected_months.indexOf(idx)
    if (pos !== -1) { if (ozState.selected_months.length > 1) ozState.selected_months.splice(pos, 1) } else ozState.selected_months.push(idx)
    oz_render_month_chips(); oz_set_default_compare(); load_all_data() }) })
}

function oz_init_month_chips() {
  let fyMonthIdx = (new Date().getMonth() - 3 + 12) % 12
  const fy = ozState.fy
  if (fy !== "All" && fy.indexOf(",") === -1) { const fyParts = fy.split("_"); if (fyParts.length === 2) {
    const fyStartDate = new Date(fyParts[0]), fyEndDate = new Date(fyParts[1])
    if (new Date() < fyStartDate || new Date() > fyEndDate) fyMonthIdx = 0 } }
  ozState.selected_months = [fyMonthIdx]; oz_render_month_chips()
}

function oz_render_qtr_chips() {
  const quarters = [{ q: 1, label: "Q1", months: "Apr-Jun" }, { q: 2, label: "Q2", months: "Jul-Sep" }, { q: 3, label: "Q3", months: "Oct-Dec" }, { q: 4, label: "Q4", months: "Jan-Mar" }]
  const container = document.getElementById("oz-qtr-chips"); if (!container) return
  let html = ""
  quarters.forEach(q => { const active = ozState.selected_qtrs.indexOf(q.q) !== -1 ? "oz-qtr-chip-active" : ""; html += '<span class="oz-qtr-chip ' + active + '" data-q="' + q.q + '" title="' + q.months + '">' + q.label + "</span>" })
  container.innerHTML = html
  container.querySelectorAll(".oz-qtr-chip").forEach(chip => { chip.addEventListener("click", function () {
    const q = parseInt(this.getAttribute("data-q")), pos = ozState.selected_qtrs.indexOf(q)
    if (pos !== -1) { if (ozState.selected_qtrs.length > 1) ozState.selected_qtrs.splice(pos, 1) } else ozState.selected_qtrs.push(q)
    oz_render_qtr_chips(); oz_set_default_compare(); load_all_data() }) })
}

function oz_init_qtr_chips() {
  const fyMonthIdx = (new Date().getMonth() - 3 + 12) % 12
  ozState.selected_qtrs = [Math.floor(fyMonthIdx / 3) + 1]; oz_render_qtr_chips()
}

function oz_render_ytd_chips() {
  const container = document.getElementById("oz-ytd-chips"); if (!container) return
  let html = ""
  fyOptions.forEach(fy => { const active = ozState.selected_ytd_fys.indexOf(fy.value) !== -1 ? "oz-month-chip-active" : ""; html += '<span class="oz-month-chip ' + active + '" data-fy="' + fy.value + '">' + fy.label + "</span>" })
  container.innerHTML = html
  container.querySelectorAll(".oz-month-chip").forEach(chip => { chip.addEventListener("click", function () {
    const fy = this.getAttribute("data-fy"), pos = ozState.selected_ytd_fys.indexOf(fy)
    if (pos !== -1) { if (ozState.selected_ytd_fys.length > 1) ozState.selected_ytd_fys.splice(pos, 1) } else ozState.selected_ytd_fys.push(fy)
    oz_render_ytd_chips(); oz_set_default_compare(); load_all_data() }) })
}

function oz_init_ytd_chips() { ozState.selected_ytd_fys = [ozState.fy]; oz_render_ytd_chips() }

function oz_set_default_compare() {
  const compareControls = document.getElementById("oz-compare-controls")
  const mc = document.getElementById("oz-month-controls"), qc = document.getElementById("oz-qtr-controls"), yc = document.getElementById("oz-ytd-controls")
  const cm = document.getElementById("oz-compare-month"), cq = document.getElementById("oz-compare-qtr"), cf = document.getElementById("oz-compare-fy")
  if (ozState.period === "MTD") {
    const sel = ozState.selected_months || []
    if (sel.length === 1) { let prev = sel[0] - 1; if (prev < 0) prev = 11; oz_set_compare("oz-compare-month", String(prev)); ozState.compare_month = String(prev); if (compareControls) compareControls.style.display = "" }
    else { oz_set_compare("oz-compare-month", ""); ozState.compare_month = ""; if (compareControls) compareControls.style.display = "none" }
  } else if (ozState.period === "QTD") {
    const selQ = ozState.selected_qtrs || []
    if (selQ.length === 1) { let prevQ = selQ[0] - 1; if (prevQ < 1) prevQ = 4; oz_set_compare("oz-compare-qtr", String(prevQ)); ozState.compare_qtr = String(prevQ); if (compareControls) compareControls.style.display = "" }
    else { oz_set_compare("oz-compare-qtr", ""); ozState.compare_qtr = ""; if (compareControls) compareControls.style.display = "none" }
  } else if (ozState.period === "YTD") {
    const selFY = ozState.selected_ytd_fys || []
    if (selFY.length === 1) { const parts = selFY[0].split("_"); if (parts.length === 2) { const s = new Date(parts[0]); const prevFY = (s.getFullYear() - 1) + "-04-01_" + s.getFullYear() + "-03-31"; oz_set_compare("oz-compare-fy", prevFY); ozState.compare_fy = prevFY } if (compareControls) compareControls.style.display = "" }
    else { oz_set_compare("oz-compare-fy", ""); ozState.compare_fy = ""; if (compareControls) compareControls.style.display = "none" }
  }
  if (mc) mc.style.display = ozState.period === "MTD" ? "" : "none"
  if (qc) qc.style.display = ozState.period === "QTD" ? "" : "none"
  if (yc) yc.style.display = ozState.period === "YTD" ? "" : "none"
  if (cm) cm.style.display = ozState.period === "MTD" ? "" : "none"
  if (cq) cq.style.display = ozState.period === "QTD" ? "" : "none"
  if (cf) cf.style.display = ozState.period === "YTD" ? "" : "none"
}

function _el(id) { return document.getElementById(id) }
function _html(id, h) { const e = _el(id); if (e) e.innerHTML = h }
function _text(id, t) { const e = _el(id); if (e) e.textContent = t }
function _style(id, k, v) { const e = _el(id); if (e) e.style[k] = v }
function _loading(ids) { ids.forEach(id => _html(id, '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:10px;">Loading...</div>')) }

function _setChange(elemId, currVal, prevVal) {
  const el = _el(elemId); if (!el) return
  if (prevVal === null || prevVal === undefined) { el.textContent = ""; el.style.color = "#94a3b8"; return }
  if (prevVal === 0) { el.textContent = "N/A"; el.style.color = "#94a3b8"; return }
  let chg = ((currVal - prevVal) / Math.abs(prevVal)) * 100
  chg = Math.max(-999, Math.min(999, chg)); const cr = Math.round(chg * 10) / 10
  const col = cr >= 0 ? "#059669" : "#dc2626", arrow = cr >= 0 ? "\u2191" : "\u2193"
  el.textContent = (cr >= 0 ? "+" : "") + cr + "% " + arrow; el.style.color = col
}

function _render_breakdown(containerId, data, total) {
  const el = _el(containerId); if (!el || !data) return
  const colors = { "GE": "#3b82f6", "GEX": "#10b981", "SHE": "#f59e0b" }
  let html = ""
  data.forEach(row => {
    const c = colors[row.abbr] || "#64748b"
    const pct = total > 0 ? ((row.total / total) * 100).toFixed(0) : 0
    html += '<div style="background:' + c + '08;border:1px solid ' + c + '20;border-radius:8px;padding:8px;text-align:center;">'
    html += '<div style="font-size:10px;font-weight:800;color:' + c + ';">' + (row.abbr || row.company) + "</div>"
    html += '<div style="font-size:12px;font-weight:800;color:#1e293b;margin-top:2px;">' + oz_k(row.total) + "</div>"
    html += '<div style="height:3px;border-radius:3px;background:#f1f5f9;margin-top:4px;overflow:hidden;"><div style="height:100%;width:' + pct + "%;background:" + c + ';border-radius:3px;"></div></div></div>'
  })
  el.innerHTML = html
}

function _render_top_items(data) {
  const el = _el("oz-top-items"); if (!el) return
  if (!data || !data.length) { el.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;">No sales data</div>'; return }
  const totalRev = data.reduce((s, row) => s + (row.revenue || row.total_revenue || 0), 0)
  let h = '<table class="oz-table"><thead><tr><th>#</th><th>Item</th><th>Qty</th><th style="text-align:right;">Revenue</th><th style="width:100px;">% of Total</th></tr></thead><tbody>'
  data.forEach((row, i) => {
    const rev = row.revenue || row.total_revenue || 0, qty = row.qty || row.total_qty || 0
    const pct = totalRev > 0 ? ((rev / totalRev) * 100).toFixed(1) : "0.0"
    const rankColor = i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7f32" : "#e2e8f0"
    const rankText = i < 3 ? "#fff" : "#94a3b8"
    h += '<tr><td><span class="oz-rank" style="background:' + rankColor + ";color:" + rankText + ';">' + (i + 1) + '</span></td>'
    h += '<td style="font-weight:700;color:#1e293b;">' + row.item_code + "</td>"
    h += "<td>" + oz_n(qty) + "</td>"
    h += '<td style="text-align:right;font-weight:700;color:#3b82f6;">' + oz_k(rev) + "</td>"
    h += '<td><div style="display:flex;align-items:center;gap:6px;"><div class="oz-prog" style="flex:1;"><div class="oz-prog-fill" style="width:' + pct + '%;background:linear-gradient(90deg,#3b82f6,#60a5fa);"></div></div><span style="font-size:9px;font-weight:700;color:#64748b;min-width:32px;text-align:right;">' + pct + "%</span></div></td></tr>"
  })
  h += "</tbody></table>"; el.innerHTML = h
}

function _render_company_comparison(kpiData) {
  const el = _el("oz-company-compare"); if (!el || !kpiData) return
  const salesByCo = kpiData.sales_by_company || [], procByCo = kpiData.procurement_by_company || []
  const coMap = {}
  salesByCo.forEach(s => { coMap[s.company] = coMap[s.company] || { company: s.company, sales: 0, purchase: 0, stock: 0 }; coMap[s.company].sales = s.total || 0; coMap[s.company].abbr = s.abbr || s.company })
  procByCo.forEach(p => { coMap[p.company] = coMap[p.company] || { company: p.company, sales: 0, purchase: 0, stock: 0 }; coMap[p.company].purchase = p.total || 0; coMap[p.company].abbr = p.abbr || p.company })
  const data = Object.values(coMap)
  if (!data.length) { el.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;">No comparison data</div>'; return }
  const maxVal = Math.max.apply(null, data.map(d => Math.max(d.sales, d.purchase))) || 1
  const colorMap = { "GE": { bg: "#eff6ff", accent: "#3b82f6" }, "GEX": { bg: "#ecfdf5", accent: "#10b981" }, "SHE": { bg: "#fef3c7", accent: "#f59e0b" } }
  let h = '<div style="display:grid;grid-template-columns:repeat(' + Math.min(data.length, 3) + ',1fr);gap:12px;">'
  data.forEach(d => {
    const abbr = d.abbr || d.company.substring(0, 3).toUpperCase(), c = colorMap[abbr] || { bg: "#f8fafc", accent: "#64748b" }
    h += '<div style="background:' + c.bg + ";border-radius:12px;padding:16px;\">"
    h += '<div style="font-size:14px;font-weight:800;color:' + c.accent + ';margin-bottom:12px;">' + abbr + '<span style="font-size:9px;font-weight:600;color:#94a3b8;margin-left:4px;">' + d.company + "</span></div>"
    h += '<div style="margin-bottom:8px;"><div style="display:flex;justify-content:space-between;font-size:9px;font-weight:700;color:#64748b;margin-bottom:3px;"><span>Sales</span><span>' + oz_k(d.sales) + '</span></div><div class="oz-prog"><div class="oz-prog-fill" style="width:' + (d.sales / maxVal * 100) + '%;background:#3b82f6;"></div></div></div>'
    h += '<div><div style="display:flex;justify-content:space-between;font-size:9px;font-weight:700;color:#64748b;margin-bottom:3px;"><span>Procurement</span><span>' + oz_k(d.purchase) + '</span></div><div class="oz-prog"><div class="oz-prog-fill" style="width:' + (d.purchase / maxVal * 100) + '%;background:#10b981;"></div></div></div></div>'
  })
  h += "</div>"; el.innerHTML = h
}

function oz_render_routes_breakdown(data) {
  const el = _el("oz-routes-breakdown"); if (!el) return
  if (!data || !data.length) { el.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:10px;">No routes found</div>'; return }
  const grads = [["#60a5fa","#3b82f6","#eff6ff"],["#a78bfa","#8b5cf6","#f5f3ff"],["#22d3ee","#06b6d4","#ecfeff"],["#fbbf24","#f59e0b","#fffbeb"],["#34d399","#10b981","#ecfdf5"],["#f87171","#ef4444","#fef2f2"]]
  let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;">'
  data.forEach((r, idx) => {
    const fromAbbr = r.company.replace(/^(\S+).*/, "$1"), toAbbr = r.to_company.replace(/^(\S+).*/, "$1")
    const grad = grads[idx % grads.length]
    html += '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">'
    html += '<div style="background:linear-gradient(135deg,' + grad[2] + ",#fff);border-bottom:1px solid " + grad[0] + '30;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;">'
    html += '<div style="display:flex;align-items:center;gap:8px;"><div style="background:' + grad[0] + '18;border:1px solid ' + grad[0] + '30;border-radius:6px;padding:4px 10px;"><span style="font-size:11px;font-weight:800;color:' + grad[0] + ';">' + fromAbbr + '</span></div>'
    html += '<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 9h10M10 5l4 4-4 4" stroke="' + grad[0] + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    html += '<div style="background:' + grad[0] + '18;border:1px solid ' + grad[0] + '30;border-radius:6px;padding:4px 10px;"><span style="font-size:11px;font-weight:800;color:' + grad[0] + ';">' + toAbbr + '</span></div></div>'
    html += '<div style="background:' + grad[0] + ';border-radius:5px;padding:5px;margin:5px;display:inline-flex;"><span style="font-size:13px;font-weight:800;color:#fff;">' + r.cnt + '</span></div></div>'
    html += '<div style="padding:12px 14px;"><div style="display:flex;gap:16px;margin-bottom:10px;">'
    html += '<div style="flex:1;"><div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Volume</div><div style="font-size:14px;font-weight:800;color:#0891b2;">' + oz_n(r.qty) + ' <span style="font-size:9px;font-weight:600;color:#94a3b8;">L</span></div></div>'
    html += '<div style="flex:1;"><div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px;">Value</div><div style="font-size:14px;font-weight:800;color:#059669;">' + oz_k(r.value) + '</div></div></div></div></div>'
  })
  html += "</div>"; el.innerHTML = html
}

function oz_render_reserved_by_company(data) {
  const el = _el("oz-res-by-company"); if (!el) return
  if (!data || !data.length) { el.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8;font-size:10px;">No data</div>'; return }
  let maxVal = 0; data.forEach(r => { const v = r.val || r.value || 0; if (v > maxVal) maxVal = v })
  let html = '<div style="display:flex;flex-wrap:wrap;gap:8px;">'
  data.forEach(r => { const v = r.val || r.value || 0; const pct = maxVal > 0 ? (v / maxVal) * 100 : 0; const abbr = (r.company || "").replace(/^(\S+).*/, "$1")
    html += '<div style="flex:1;min-width:160px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;">'
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><span style="font-size:11px;font-weight:700;color:#1e293b;">' + abbr + '</span><span style="font-size:10px;font-weight:800;color:#d97706;">' + oz_n(r.qty) + ' L</span></div>'
    html += '<div style="height:4px;border-radius:4px;background:#f1f5f9;overflow:hidden;margin-bottom:4px;"><div style="height:100%;width:' + pct + '%;border-radius:4px;background:linear-gradient(90deg,#f59e0b,#d97706);transition:width 0.8s cubic-bezier(0.22,1,0.36,1);"></div></div>'
    html += '<div style="font-size:8px;font-weight:700;color:#94a3b8;text-align:right;">' + oz_k(v) + '</div></div>' })
  html += "</div>"; el.innerHTML = html
}

async function load_all_data() {
  const co = ozState.company, item = ozState.item, period = ozState.period
  oz_update_filter_tag()
  _text("oz-period-sales", period); _text("oz-period-proc", period); _text("oz-period-pl", period)

  const kpiIds = ["oz-kpi-sales","oz-kpi-proc","oz-kpi-avail","oz-kpi-reserved","oz-kpi-neg","oz-kpi-pl","oz-kpi-ict2","oz-kpi-ict-count","oz-kpi-ict-val","oz-kpi-reserved2","oz-kpi-resqty","oz-kpi-res-val","oz-kpi-res-items","oz-kpi-res-util","oz-kpi-res-companies"]
  kpiIds.forEach(id => _text(id, "--"))
  _text("oz-kpi-sales-change", ""); _text("oz-kpi-proc-change", ""); _text("oz-kpi-pl-change", "")
  _loading(["oz-bar-chart","oz-chart-donut","oz-funnel-content","oz-ring","oz-mini-stats","oz-table-res","oz-table-ict","oz-table-neg","oz-activity","oz-top-items","oz-top-customers","oz-company-compare","oz-ict-chain","oz-warehouse-table","oz-routes-breakdown","oz-res-by-company"])
  _html("oz-spark-sales", ""); _html("oz-spark-proc", ""); _html("oz-spark-pl", "")
  _html("oz-sales-breakdown", ""); _html("oz-proc-breakdown", ""); _html("oz-pl-breakdown", "")

  const args = { company: co, item: item, fy: ozState.fy || "All", period }
  if (period === "MTD") args.selected_months = (ozState.selected_months || []).join(",")
  if (period === "QTD") args.selected_qtrs = (ozState.selected_qtrs || []).join(",")
  if (period === "YTD") args.selected_ytd_fys = (ozState.selected_ytd_fys || []).join(",")
  if (period === "MTD" && ozState.compare_month !== undefined && ozState.compare_month !== "") args.compare_month = ozState.compare_month
  else if (period === "QTD" && ozState.compare_qtr !== undefined && ozState.compare_qtr !== "") args.compare_qtr = ozState.compare_qtr
  else if (period === "YTD" && ozState.compare_fy !== undefined && ozState.compare_fy !== "") args.compare_fy = ozState.compare_fy

  /* KPIs */
  try {
    const d = await frappeRequest({ url: "oil_distribution.api.oil_ops.get_command_center_kpis", params: args })
    if (d) {
      ozState.kpi_data = d
      const abbrMap = { "Geeta Enterprise": "GE", "Global Export": "GEX", "Shubham Enterprise": "SHE" }
      if (d.sales_by_company) d.sales_by_company.forEach(r => { if (!r.abbr) r.abbr = abbrMap[r.company] || r.company })
      if (d.procurement_by_company) d.procurement_by_company.forEach(r => { if (!r.abbr) r.abbr = abbrMap[r.company] || r.company })
      if (!d.profit_loss_by_company) {
        const salesMap = {}, procMap = {}
        if (d.sales_by_company) d.sales_by_company.forEach(r => { salesMap[r.company] = r.total })
        if (d.procurement_by_company) d.procurement_by_company.forEach(r => { procMap[r.company] = r.total })
        const allCos = new Set([...Object.keys(salesMap), ...Object.keys(procMap)])
        d.profit_loss_by_company = []
        allCos.forEach(co => {
          const s = salesMap[co] || 0, p = procMap[co] || 0
          d.profit_loss_by_company.push({ company: co, total: s - p, abbr: abbrMap[co] || co })
        })
      }
      if (d.profit_loss_by_company) d.profit_loss_by_company.forEach(r => { if (!r.abbr) r.abbr = abbrMap[r.company] || r.company })

      oz_count(_el("oz-kpi-sales"), Math.round(d.sales_mtd), A, ""); setTimeout(() => _text("oz-kpi-sales", oz_k(d.sales_mtd)), 1300)
      oz_count(_el("oz-kpi-proc"), Math.round(d.procurement_mtd), A, ""); setTimeout(() => _text("oz-kpi-proc", oz_k(d.procurement_mtd)), 1300)

      const plColor = d.profit_loss >= 0 ? "#059669" : "#dc2626", plBg = d.profit_loss >= 0 ? "#d1fae5" : "#fee2e2"
      _style("oz-kpi-pl", "color", plColor); _style("oz-kpi-pl-icon", "background", plBg); _style("oz-kpi-pl-icon", "color", plColor)
      oz_count(_el("oz-kpi-pl"), Math.round(d.profit_loss), A, ""); setTimeout(() => _text("oz-kpi-pl", oz_k(d.profit_loss)), 1300)

      _setChange("oz-kpi-sales-change", d.sales_mtd, d.sales_prev)
      _setChange("oz-kpi-proc-change", d.procurement_mtd, d.procurement_prev)
      _setChange("oz-kpi-pl-change", d.profit_loss, d.profit_loss_prev)

      oz_count(_el("oz-kpi-avail"), Math.round(d.available_stock), "", " L"); setTimeout(() => _text("oz-kpi-avail", oz_n(d.available_stock) + " L"), 1300)
      oz_count(_el("oz-kpi-reserved"), Math.round(d.reserved_stock), "", " L"); setTimeout(() => _text("oz-kpi-reserved", oz_n(d.reserved_stock) + " L"), 1300)
      oz_count(_el("oz-kpi-neg"), d.negative_alerts, "", ""); setTimeout(() => _text("oz-kpi-neg", d.negative_alerts + " Alerts"), 1300)
      oz_count(_el("oz-kpi-ict2"), Math.round(d.intercompany_volume), "", " L"); setTimeout(() => _text("oz-kpi-ict2", oz_n(d.intercompany_volume) + " L"), 1300)

      if (d.ict_count_mtd !== undefined) { oz_count(_el("oz-kpi-ict-count"), d.ict_count_mtd, "", ""); setTimeout(() => _text("oz-kpi-ict-count", d.ict_count_mtd), 1300) }
      if (d.ict_value_mtd !== undefined) { oz_count(_el("oz-kpi-ict-val"), Math.round(d.ict_value_mtd), A, ""); setTimeout(() => _text("oz-kpi-ict-val", oz_k(d.ict_value_mtd)), 1300) }
      if (d.reserved_value !== undefined) { oz_count(_el("oz-kpi-res-val"), Math.round(d.reserved_value), A, ""); setTimeout(() => _text("oz-kpi-res-val", oz_k(d.reserved_value)), 1300) }
      if (d.reserved_items !== undefined) { oz_count(_el("oz-kpi-res-items"), d.reserved_items, "", ""); setTimeout(() => _text("oz-kpi-res-items", d.reserved_items), 1300) }
      if (d.utilization_pct !== undefined) { oz_count(_el("oz-kpi-res-util"), d.utilization_pct, "", "%"); setTimeout(() => _text("oz-kpi-res-util", d.utilization_pct + "%"), 1300) }

      _render_breakdown("oz-sales-breakdown", d.sales_by_company, d.sales_mtd)
      _render_breakdown("oz-proc-breakdown", d.procurement_by_company, d.procurement_mtd)
      _render_breakdown("oz-pl-breakdown", d.profit_loss_by_company, Math.abs(d.profit_loss))

      const tot = d.available_stock + d.reserved_stock
      let fh = '<div style="display:flex;flex-direction:column;gap:6px;">'
      ;[{ l: "Total", v: tot, c: "#3b82f6", p: 100 }, { l: "Available", v: d.available_stock, c: "#10b981", p: tot > 0 ? (d.available_stock / tot) * 100 : 0 },
        { l: "Reserved", v: d.reserved_stock, c: "#f59e0b", p: tot > 0 ? (d.reserved_stock / tot) * 100 : 0 },
        { l: "Negative", v: d.negative_alerts, c: "#ef4444", p: tot > 0 ? (d.negative_alerts / tot) * 100 : 0 }].forEach(s => {
        fh += '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:9px;font-weight:700;color:#64748b;width:52px;flex-shrink:0;">' + s.l + '</span>'
        fh += '<div style="flex:1;height:5px;border-radius:5px;background:#f1f5f9;overflow:hidden;"><div style="height:100%;width:' + s.p + '%;border-radius:5px;background:' + s.c + ';transition:width 0.8s cubic-bezier(0.22,1,0.36,1);"></div></div>'
        fh += '<span style="font-size:10px;font-weight:800;color:' + s.c + ';min-width:40px;text-align:right;">' + s.v.toLocaleString() + '</span>'
        fh += '<span style="font-size:8px;font-weight:700;color:' + s.c + ';min-width:28px;text-align:right;">' + Math.round(s.p) + '%</span></div>' })
      fh += '</div>'; _html("oz-funnel-content", fh)

      oz_ring(_el("oz-ring"), tot > 0 ? (d.reserved_stock / tot) * 100 : 0, "#3b82f6", "#7c3aed")
      _render_top_items(d.top_items)
      _render_company_comparison(d)
      if (d.reserved_by_company) oz_render_reserved_by_company(d.reserved_by_company)
      if (d.routes_breakdown) oz_render_routes_breakdown(d.routes_breakdown)

      if (d.reserved_by_company) { const rc = d.reserved_by_company.length; oz_count(_el("oz-kpi-res-companies"), rc, "", ""); setTimeout(() => _text("oz-kpi-res-companies", rc), 1300) }

      let ms = ""
      ;[{ l: "Sales", v: oz_k(d.sales_mtd), c: "#3b82f6" }, { l: "Procurement", v: oz_k(d.procurement_mtd), c: "#10b981" },
        { l: "Available", v: oz_n(d.available_stock) + " L", c: "#7c3aed" }, { l: "Reserved", v: oz_n(d.reserved_stock) + " L", c: "#f59e0b" },
        { l: "ICTs", v: oz_n(d.intercompany_volume) + " L", c: "#0891b2" }, { l: "Alerts", v: d.negative_alerts, c: "#ef4444" }].forEach(s => {
        ms += '<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:6px;margin-bottom:3px;background:' + s.c + '08;">'
        ms += '<div style="width:4px;height:18px;border-radius:2px;background:' + s.c + ';"></div>'
        ms += '<span style="flex:1;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;color:#94a3b8;">' + s.l + '</span>'
        ms += '<span style="font-size:12px;font-weight:800;color:' + s.c + ';">' + s.v + '</span></div>' })
      _html("oz-mini-stats", ms)

      /* Sparklines */
      const sparkVals = [d.sales_mtd * 0.6, d.sales_mtd * 0.75, d.sales_mtd * 0.85, d.sales_mtd * 0.95, d.sales_mtd]
      oz_sparkline(_el("oz-spark-sales"), sparkVals, "#10b981")
      oz_sparkline(_el("oz-spark-proc"), [d.procurement_mtd * 0.5, d.procurement_mtd * 0.7, d.procurement_mtd * 0.8, d.procurement_mtd * 0.9, d.procurement_mtd], "#f59e0b")
      oz_sparkline_with_pct(_el("oz-spark-pl"), [0, 0, 0, 0, d.sales_mtd - d.procurement_mtd], "#3b82f6", d.sales_mtd - d.procurement_mtd)

      /* Bar chart */
      const months = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"]
      const curM = new Date().getMonth(); const fyIdx = (curM - 3 + 12) % 12
      const mLabel = months[fyIdx]
      oz_build_stacked_bar(
        _el("oz-bar-chart"), _el("oz-bar-tooltip"),
        [mLabel],
        [d.sales_mtd || 0],
        [d.procurement_mtd || 0],
        [d.sales_mtd - d.procurement_mtd],
        null
      )
    }
  } catch (e) { console.error("KPI load error:", e) }

  /* Stock, ICT, Reservations - parallel */
  const pStock = frappeRequest({ url: "oil_distribution.api.oil_ops.get_stock_kpis", params: args }).catch(() => null)
  const pNeg = frappeRequest({ url: "oil_distribution.api.oil_ops.get_negative_stock", params: args }).catch(() => null)
  const pIctKpi = frappeRequest({ url: "oil_distribution.api.oil_ops.get_ict_kpis", params: args }).catch(() => null)
  const pIctRoutes = frappeRequest({ url: "oil_distribution.api.oil_ops.get_ict_routes", params: args }).catch(() => null)
  const pIctList = frappeRequest({ url: "oil_distribution.api.oil_ops.get_ict_list", params: { ...args, limit: 30 } }).catch(() => null)
  const pResKpi = frappeRequest({ url: "oil_distribution.api.oil_ops.get_reservation_kpis", params: args }).catch(() => null)
  const pResByCo = frappeRequest({ url: "oil_distribution.api.oil_ops.get_reserved_by_company", params: args }).catch(() => null)
  const pActiveRes = frappeRequest({ url: "oil_distribution.api.oil_ops.get_active_reservations", params: { ...args, limit: 30 } }).catch(() => null)
  const pTopCust = frappeRequest({ url: "oil_distribution.api.oil_ops.get_top_customers", params: args }).catch(() => null)
  const pWh = frappeRequest({ url: "oil_distribution.api.oil_ops.get_stock_by_warehouse", params: args }).catch(() => null)

  const [stockData, negData, ictKpiData, ictRoutesData, ictListData, resKpiData, resByCoData, activeResData, topCustData, whData] = await Promise.all([pStock, pNeg, pIctKpi, pIctRoutes, pIctList, pResKpi, pResByCo, pActiveRes, pTopCust, pWh])

  /* Stock Intelligence */
  const mainKpi = ozState.kpi_data || {}
  const sd = stockData || {}
  const avail = sd.available_qty ?? mainKpi.available_stock ?? 0
  const reserved = sd.reserved_qty ?? mainKpi.reserved_stock ?? 0
  const negCnt = sd.negative_count ?? mainKpi.negative_alerts ?? 0
  oz_count(_el("oz-kpi-avail"), Math.round(avail), "", " L")
  setTimeout(() => _text("oz-kpi-avail", oz_n(avail) + " L"), 1300)
  oz_count(_el("oz-kpi-reserved"), Math.round(reserved), "", " L")
  setTimeout(() => _text("oz-kpi-reserved", oz_n(reserved) + " L"), 1300)
  oz_count(_el("oz-kpi-neg"), negCnt, "", "")
  setTimeout(() => _text("oz-kpi-neg", negCnt + " Alerts"), 1300)
  const tot2 = avail + reserved
  let fh2 = '<div style="display:flex;flex-direction:column;gap:6px;">'
  ;[{ l: "Total", v: tot2, c: "#3b82f6", p: 100 }, { l: "Available", v: avail, c: "#10b981", p: tot2 > 0 ? (avail / tot2) * 100 : 0 },
    { l: "Reserved", v: reserved, c: "#f59e0b", p: tot2 > 0 ? (reserved / tot2) * 100 : 0 },
    { l: "Negative", v: negCnt, c: "#ef4444", p: tot2 > 0 ? (negCnt / tot2) * 100 : 0 }].forEach(s => {
    fh2 += '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:9px;font-weight:700;color:#64748b;width:52px;flex-shrink:0;">' + s.l + '</span>'
    fh2 += '<div style="flex:1;height:5px;border-radius:5px;background:#f1f5f9;overflow:hidden;"><div style="height:100%;width:' + s.p + '%;border-radius:5px;background:' + s.c + ';transition:width 0.8s cubic-bezier(0.22,1,0.36,1);"></div></div>'
    fh2 += '<span style="font-size:10px;font-weight:800;color:' + s.c + ';min-width:40px;text-align:right;">' + (s.v || 0).toLocaleString() + '</span></div>' })
  fh2 += '</div>'; _html("oz-funnel-content", fh2)
  oz_ring(_el("oz-ring"), tot2 > 0 ? (reserved / tot2) * 100 : 0, "#3b82f6", "#7c3aed")
  /* Donut from stock by company */
  try {
    const stockByCo = await frappeRequest({ url: "oil_distribution.api.oil_ops.get_stock_by_company", params: args }).catch(() => null)
    if (stockByCo && stockByCo.length) {
      const cols = ["#3b82f6", "#10b981", "#f59e0b", "#7c3aed"]
      const donutData = stockByCo.map((s, i) => ({ label: s.company, value: Math.round(s.avail_qty || 0), color: cols[i] || cols[3] }))
      oz_donut(_el("oz-chart-donut"), donutData, 130)
    }
  } catch (e) {}

  /* Negative stock */
  if (negData && negData.length) {
    let h = '<table class="oz-table"><thead><tr><th>Item</th><th>Warehouse</th><th>Qty</th></tr></thead><tbody>'
    negData.forEach(row => { h += '<tr><td style="font-weight:700;">' + (row.item_code || "") + '</td><td>' + (row.warehouse || row.warehouse_name || "") + '</td><td style="font-weight:800;color:#dc2626;">' + oz_n(row.actual_qty) + '</td></tr>' })
    h += "</tbody></table>"; _html("oz-table-neg", h)
  } else { _html("oz-table-neg", '<div style="text-align:center;padding:20px;color:#059669;font-weight:600;">No negative stock</div>') }

  /* ICT KPIs */
  if (ictKpiData) {
    const ik = ictKpiData
    oz_count(_el("oz-kpi-ict2"), Math.round(ik.total_volume || 0), "", " L"); setTimeout(() => _text("oz-kpi-ict2", oz_n(ik.total_volume || 0) + " L"), 1300)
    oz_count(_el("oz-kpi-ict-count"), ik.ict_count || 0, "", ""); setTimeout(() => _text("oz-kpi-ict-count", ik.ict_count || 0), 1300)
    oz_count(_el("oz-kpi-ict-val"), Math.round(ik.ict_value || 0), A, ""); setTimeout(() => _text("oz-kpi-ict-val", oz_k(ik.ict_value || 0)), 1300)
  }

  /* ICT Routes */
  if (ictRoutesData) oz_render_routes_breakdown(ictRoutesData)

  /* ICT List */
  if (ictListData && ictListData.length) {
    let ht = '<table class="oz-table"><thead><tr><th>ID</th><th>From</th><th>To</th><th>Qty</th><th>Value</th><th>Date</th></tr></thead><tbody>'
    ictListData.forEach(row => {
      ht += '<tr><td style="font-weight:700;color:#0891b2;">' + row.name + "</td>"
      ht += "<td>" + (row.company || "") + "</td><td>" + (row.to_company || "") + "</td>"
      ht += '<td style="font-weight:800;color:#1e293b;">' + oz_n(row.total_qty) + "</td>"
      ht += '<td style="font-weight:700;color:#059669;">' + oz_k(row.grand_total) + "</td>"
      ht += '<td style="color:#94a3b8;">' + (row.posting_date || "") + "</td></tr>" })
    ht += "</tbody></table>"; _html("oz-table-ict", ht)
    /* Chain detail */
    let hc = ""
    ictListData.slice(0, 5).forEach(row => {
      hc += '<div style="border:1px solid #f1f5f9;border-radius:10px;padding:12px;margin-bottom:8px;">'
      hc += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">'
      hc += '<span style="font-weight:700;color:#0891b2;font-size:11px;">' + row.name + "</span>"
      hc += '<span class="oz-badge" style="color:#059669;background:#ecfdf5;">' + oz_k(row.grand_total) + "</span></div>"
      hc += '<div class="oz-chain"><span class="oz-chain-step oz-chain-active">' + (row.company || "") + "</span>"
      hc += '<span class="oz-chain-arrow">\u2192</span><span class="oz-chain-step oz-chain-active">' + (row.to_company || "") + "</span></div>"
      hc += '<div style="font-size:9px;color:#94a3b8;">' + oz_n(row.total_qty) + " L | " + (row.status || "") + "</div></div>" })
    if (!hc) hc = '<div style="text-align:center;padding:20px;color:#94a3b8;">No ICT data</div>'
    _html("oz-ict-chain", hc)
    /* Activity feed */
    let ha = '<div class="oz-tl">'
    ictListData.slice(0, 8).forEach(row => {
      ha += '<div class="oz-tl-item"><div class="oz-tl-dot" style="background:#ecfeff;color:#0891b2;">\u21BB</div>'
      ha += '<div style="flex:1;min-width:0;"><div style="font-size:10px;font-weight:600;color:#1e293b;">' + (row.company || "") + " \u2192 " + (row.to_company || "") + "</div>"
      ha += '<div style="display:flex;align-items:center;gap:5px;margin-top:2px;"><span style="font-size:8px;font-weight:700;color:#94a3b8;">' + (row.posting_date || "") + "</span>"
      ha += '<span class="oz-badge" style="color:#0891b2;background:#ecfeff;margin-left:auto;">' + oz_n(row.total_qty) + " L</span></div></div></div>" })
    ha += "</div>"; _html("oz-activity", ha)
  } else {
    _html("oz-table-ict", '<div style="text-align:center;padding:20px;color:#94a3b8;">No transfers yet</div>')
    _html("oz-ict-chain", '<div style="text-align:center;padding:20px;color:#94a3b8;">No ICT data</div>')
    _html("oz-activity", '<div style="text-align:center;padding:20px;color:#94a3b8;">No recent activity</div>')
  }

  /* Reservations */
  if (resKpiData) {
    const rk = resKpiData
    oz_count(_el("oz-kpi-reserved2"), rk.active_count || 0, "", ""); setTimeout(() => _text("oz-kpi-reserved2", (rk.active_count || 0) + " Active"), 1300)
    oz_count(_el("oz-kpi-resqty"), Math.round(rk.total_reserved_qty || 0), "", " L"); setTimeout(() => _text("oz-kpi-resqty", oz_n(rk.total_reserved_qty || 0) + " L"), 1300)
    oz_count(_el("oz-kpi-res-val"), Math.round(rk.total_reserved_value || 0), A, ""); setTimeout(() => _text("oz-kpi-res-val", oz_k(rk.total_reserved_value || 0)), 1300)
    if (rk.utilization_pct !== undefined) { oz_count(_el("oz-kpi-res-util"), rk.utilization_pct, "", "%"); setTimeout(() => _text("oz-kpi-res-util", rk.utilization_pct + "%"), 1300) }
  }
  if (resByCoData && resByCoData.length) {
    oz_render_reserved_by_company(resByCoData)
    oz_count(_el("oz-kpi-res-companies"), resByCoData.length, "", ""); setTimeout(() => _text("oz-kpi-res-companies", resByCoData.length), 1300)
  }
  if (activeResData && activeResData.length) {
    let hr = '<table class="oz-table"><thead><tr><th>ID</th><th>Company</th><th>Item</th><th>Qty</th><th>For</th><th>Status</th></tr></thead><tbody>'
    activeResData.forEach(row => {
      hr += '<tr><td style="font-weight:700;color:#3b82f6;">' + row.name + "</td>"
      hr += "<td>" + (row.company || "") + "</td><td>" + (row.item || "") + "</td>"
      hr += '<td style="font-weight:800;color:#1e293b;">' + oz_n(row.reserved_qty) + "</td>"
      hr += '<td><span class="oz-badge" style="color:#7c3aed;background:#f5f3ff;">' + (row.reserved_for || "") + "</span></td>"
      hr += '<td><span class="oz-badge" style="color:#d97706;background:#fffbeb;">' + (row.status || "") + "</span></td></tr>" })
    hr += "</tbody></table>"; _html("oz-table-res", hr)
  } else { _html("oz-table-res", '<div style="text-align:center;padding:20px;color:#94a3b8;">No active reservations</div>') }

  /* Top customers */
  if (topCustData && topCustData.length) {
    let htc = '<div style="display:flex;flex-direction:column;gap:8px;">'
    topCustData.slice(0, 6).forEach((c, i) => {
      const cols = ["#3b82f6","#10b981","#f59e0b","#7c3aed","#ef4444","#0891b2"]
      htc += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">'
      htc += '<span style="font-size:10px;font-weight:800;color:' + cols[i] + ';">#' + (i + 1) + '</span>'
      htc += '<span style="flex:1;font-size:11px;font-weight:600;color:#1e293b;">' + (c.customer_name || c.customer || "") + '</span>'
      htc += '<span style="font-size:11px;font-weight:800;color:#d97706;">' + oz_n(c.total_qty) + ' L</span></div>' })
    htc += '</div>'; _html("oz-top-customers", htc)
  } else { _html("oz-top-customers", '<div style="text-align:center;padding:20px;color:#94a3b8;">No data</div>') }

  /* Warehouse table */
  if (whData && whData.length) {
    let hwh = '<table class="oz-table"><thead><tr><th>Warehouse</th><th>Available</th><th>Reserved</th></tr></thead><tbody>'
    whData.forEach(w => {
      hwh += '<tr><td style="font-weight:700;">' + (w.warehouse || w.warehouse_name || "") + '</td>'
      hwh += '<td style="font-weight:800;color:#10b981;">' + oz_n(w.avail_qty || w.available_qty || 0) + '</td>'
      hwh += '<td style="font-weight:700;color:#f59e0b;">' + oz_n(w.reserved_qty || 0) + '</td></tr>' })
    hwh += '</tbody></table>'; _html("oz-warehouse-table", hwh)
  } else { _html("oz-warehouse-table", '<div style="text-align:center;padding:20px;color:#94a3b8;">No data</div>') }
}

onMounted(async () => {
  await nextTick()

  /* Tabs */
  document.querySelectorAll(".oz-tab-btn").forEach(btn => {
    btn.addEventListener("click", function () {
      const tab = this.getAttribute("data-tab"); ozState.tab = tab
      document.querySelectorAll(".oz-tab-btn").forEach(b => b.classList.remove("oz-tab-active"))
      this.classList.add("oz-tab-active")
      document.querySelectorAll(".oz-tab-panel").forEach(p => p.style.display = "none")
      const panel = _el("oz-panel-" + tab); if (panel) panel.style.display = ""
      const pb = _el("oz-period-bar"); if (pb) pb.style.display = tab === "sales" ? "" : "none"
    })
  })

  /* Period buttons */
  document.querySelectorAll(".oz-period-btn").forEach(btn => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".oz-period-btn").forEach(b => b.classList.remove("oz-period-active"))
      this.classList.add("oz-period-active"); ozState.period = this.getAttribute("data-period")
      oz_set_default_compare(); load_all_data()
    })
  })

  /* Compare dropdowns */
  const months = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"]
  oz_init_compare("oz-compare-month", months.map((m, i) => ({ value: String(i), label: m })), val => { ozState.compare_month = val; load_all_data() })
  oz_init_compare("oz-compare-qtr", [{ value: "1", label: "Q1 (Apr-Jun)" }, { value: "2", label: "Q2 (Jul-Sep)" }, { value: "3", label: "Q3 (Oct-Dec)" }, { value: "4", label: "Q4 (Jan-Mar)" }], val => { ozState.compare_qtr = val; load_all_data() })
  oz_init_compare("oz-compare-fy", fyOptions, val => { ozState.compare_fy = val; load_all_data() })

  /* Period chips */
  oz_init_month_chips(); oz_init_qtr_chips(); oz_init_ytd_chips(); oz_set_default_compare()

  /* Company multi-select */
  oz_init_multi("oz-ms-company", [
    { value: "Geeta Enterprise", label: "Geeta Enterprise", abbr: "GE" },
    { value: "Global Export", label: "Global Export", abbr: "GEX" },
    { value: "Shubham Enterprise", label: "Shubham Enterprise", abbr: "SHE" }
  ], selected => {
    const allCo = ["Geeta Enterprise", "Global Export", "Shubham Enterprise"]
    const allSelected = selected.length === 0 || selected.length === allCo.length
    ozState.company = allSelected ? "All" : selected.join(","); oz_update_filter_tag(); load_all_data()
  })

  /* Item multi-select */
  oz_init_multi("oz-ms-item", [], selected => {
    const totalItems = (ozState.item_options || []).length
    const allSelected = selected.length === 0 || (totalItems > 0 && selected.length === totalItems)
    ozState.item = allSelected ? "All" : selected.join(","); oz_update_filter_tag(); load_all_data()
  })

  /* FY multi-select */
  oz_init_multi("oz-ms-fy", fyOptions, selected => {
    const allFy = fyOptions.map(o => o.value)
    const allSelected = selected.length === 0 || selected.length === allFy.length
    ozState.fy = allSelected ? "All" : selected.join(","); oz_update_filter_tag()
    if (ozState.period === "MTD") oz_init_month_chips()
    if (ozState.period === "YTD") oz_init_ytd_chips()
    load_all_data()
  }, [_curFYValue])

  /* Populate items list */
  try {
    const items = await frappeRequest({ url: "oil_distribution.api.oil_ops.get_items", params: {} })
    if (items && items.length) {
      const opts = items.map(item => ({ value: item.name, label: item.name + " — " + item.item_name }))
      ozState.item_options = opts; oz_update_options("oz-ms-item", opts)
    }
  } catch (e) { console.error("Items load error:", e) }

  load_all_data()
})
</script>
