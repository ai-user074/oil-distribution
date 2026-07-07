frappe.pages['oil-command-center'].on_page_load = function (wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Oil Distribution Command Center',
		single_column: true,
	});

	window.oz_company = 'All';

	page.main.html(get_dashboard_html());

	page.add_button(__("Refresh"), function () {
		load_all_data();
	}, "refresh");

	load_all_data();
};

function get_dashboard_html() {
	return `
	<style>
		#page-oil-command-center .page-body { padding: 0 !important; background: #f8fafc; }
		.oz-enter { animation: ozEnter 0.45s cubic-bezier(0.22,1,0.36,1) both; }
		@keyframes ozEnter { 0% { opacity:0; transform:translateY(12px); } 100% { opacity:1; transform:translateY(0); } }
		.oz-card { transition: all 0.35s cubic-bezier(0.23,1,0.32,1); }
		.oz-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,20,40,0.08), 0 0 0 1px rgba(59,130,246,0.08); }
		.oz-kpi { transition: all 0.3s cubic-bezier(0.23,1,0.32,1); cursor: pointer; }
		.oz-kpi:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0,20,40,0.1); }
		.oz-table tr { transition: background 0.15s; }
		.oz-table tr:hover { background: #f1f5f9; }
		.oz-funnel-fill { transition: width 0.8s cubic-bezier(0.22,1,0.36,1); }
		@keyframes ozLive { 0%,100%{opacity:1;}50%{opacity:.5;} }
		.oz-live { animation: ozLive 2s ease-in-out infinite; }
		.oz-heat { transition: all 0.2s; }
		.oz-heat:hover { transform: scale(1.05); }
		.oz-tl-item { transition: all 0.2s; }
		.oz-tl-item:hover { background: #f1f5f9; transform: translateX(3px); }
		.oz-ring-track { transition: stroke-dasharray 1s ease; }
	</style>

	<div class="p-5 min-h-screen bg-slate-50">

		<!-- ═══ COMPANY SELECTOR ═══ -->
		<div class="flex items-center gap-2 p-2 bg-white rounded-2xl border border-slate-200 shadow-sm mb-5 oz-enter" style="animation-delay:0.02s">
			<span class="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-2 mr-1">Company</span>
			<button class="oz-company-btn px-4 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wide border border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all" onclick="oz_set_company('All',this)">All Companies</button>
			<button class="oz-company-btn px-4 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wide border border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all" onclick="oz_set_company('Geeta Enterprise',this)">Geeta Enterprise</button>
			<button class="oz-company-btn px-4 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wide border border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all" onclick="oz_set_company('Global Export',this)">Global Export</button>
			<button class="oz-company-btn px-4 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wide border border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all" onclick="oz_set_company('Shubham Enterprise',this)">Shubham Enterprise</button>
		</div>

		<!-- ═══ KEY METRICS ═══ -->
		<div class="oz-card bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4 oz-enter" style="animation-delay:0.04s">
			<div class="flex items-center gap-2 mb-4">
				<div class="w-2 h-2 rounded-full bg-emerald-400 oz-live"></div>
				<h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Key Metrics</h3>
			</div>
			<div class="grid grid-cols-6 gap-3" id="oz-kpis">
				<div class="oz-kpi rounded-xl p-4 text-center bg-blue-50 border border-blue-100" onclick="frappe.set_route('List','Sales Invoice')">
					<div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2 text-sm font-bold">₹</div>
					<div class="text-xl font-extrabold text-blue-600" id="oz-kpi-sales">--</div>
					<div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Sales (MTD)</div>
					<div class="text-[9px] font-semibold text-blue-500 mt-0.5">Click to view</div>
				</div>
				<div class="oz-kpi rounded-xl p-4 text-center bg-emerald-50 border border-emerald-100" onclick="frappe.set_route('List','Purchase Invoice')">
					<div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 text-sm font-bold">₹</div>
					<div class="text-xl font-extrabold text-emerald-600" id="oz-kpi-proc">--</div>
					<div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Procurement (MTD)</div>
					<div class="text-[9px] font-semibold text-emerald-500 mt-0.5">Click to view</div>
				</div>
				<div class="oz-kpi rounded-xl p-4 text-center bg-violet-50 border border-violet-100" onclick="frappe.set_route('List','Bin',{warehouse:['like','Available WH%']})">
					<div class="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center mx-auto mb-2 text-sm font-bold">📦</div>
					<div class="text-xl font-extrabold text-violet-600" id="oz-kpi-avail">--</div>
					<div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Available Stock</div>
					<div class="text-[9px] font-semibold text-violet-500 mt-0.5">Click to view bins</div>
				</div>
				<div class="oz-kpi rounded-xl p-4 text-center bg-amber-50 border border-amber-100" onclick="frappe.set_route('List','Stock Reservation',{status:'Reserved'})">
					<div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2 text-sm font-bold">🔒</div>
					<div class="text-xl font-extrabold text-amber-600" id="oz-kpi-reserved">--</div>
					<div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Swastik Reserved</div>
					<div class="text-[9px] font-semibold text-amber-500 mt-0.5">Click to view</div>
				</div>
				<div class="oz-kpi rounded-xl p-4 text-center bg-rose-50 border border-rose-100" onclick="frappe.set_route('List','Bin',{actual_qty:['<',0]})">
					<div class="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2 text-sm font-bold">⚠</div>
					<div class="text-xl font-extrabold text-rose-600" id="oz-kpi-neg">--</div>
					<div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Negative Alerts</div>
					<div class="text-[9px] font-semibold text-rose-500 mt-0.5">Click to view</div>
				</div>
				<div class="oz-kpi rounded-xl p-4 text-center bg-cyan-50 border border-cyan-100" onclick="frappe.set_route('List','Inter Company Transfer',{docstatus:1})">
					<div class="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center mx-auto mb-2 text-sm font-bold">🔄</div>
					<div class="text-xl font-extrabold text-cyan-600" id="oz-kpi-ict">--</div>
					<div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">ICT Volume (MTD)</div>
					<div class="text-[9px] font-semibold text-cyan-500 mt-0.5">Click to view</div>
				</div>
			</div>
		</div>

		<!-- ═══ SALES & PROCUREMENT INTELLIGENCE ═══ -->
		<div class="flex items-center gap-2 mb-3 oz-enter" style="animation-delay:0.08s">
			<div class="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">📊</div>
			<div>
				<div class="text-xs font-bold uppercase tracking-wider text-slate-600">Sales &amp; Procurement Intelligence</div>
				<div class="text-[10px] text-slate-400">6-month trend analysis &amp; company distribution</div>
			</div>
		</div>
		<div class="grid grid-cols-2 gap-4 mb-4 oz-enter" style="animation-delay:0.1s">
			<div class="oz-card bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
				<div class="flex items-center gap-2 mb-3">
					<div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">📈</div>
					<div>
						<div class="text-sm font-bold text-slate-700">Sales vs Procurement Trend</div>
						<div class="text-[10px] text-slate-400">Last 6 months performance</div>
					</div>
				</div>
				<div id="oz-chart-trend" style="min-height:200px;"></div>
			</div>
			<div class="oz-card bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
				<div class="flex items-center gap-2 mb-3">
					<div class="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-sm">💡</div>
					<div>
						<div class="text-sm font-bold text-slate-700">Stock Distribution</div>
						<div class="text-[10px] text-slate-400">Available &amp; Reserved by company</div>
					</div>
				</div>
				<div id="oz-chart-donut" style="min-height:200px;display:flex;align-items:center;justify-content:center;"></div>
			</div>
		</div>

		<!-- ═══ SWASTIK RESERVATION PIPELINE ═══ -->
		<div class="flex items-center gap-2 mb-3 oz-enter" style="animation-delay:0.14s">
			<div class="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">🛡</div>
			<div>
				<div class="text-xs font-bold uppercase tracking-wider text-slate-600">Swastik Reservation Pipeline</div>
				<div class="text-[10px] text-slate-400">Stock reservation funnel &amp; throughput</div>
			</div>
		</div>
		<div class="grid grid-cols-12 gap-4 mb-4 oz-enter" style="animation-delay:0.16s">
			<div class="col-span-5 oz-card bg-white rounded-2xl border border-slate-200 shadow-sm p-5" id="oz-funnel">
				<div class="flex items-center gap-2 mb-3">
					<div class="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-sm">🔥</div>
					<div>
						<div class="text-sm font-bold text-slate-700">Stock Funnel</div>
						<div class="text-[10px] text-slate-400">From available to reserved</div>
					</div>
				</div>
				<div id="oz-funnel-content"></div>
			</div>
			<div class="col-span-3 oz-card bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
				<div class="flex items-center gap-2 mb-3">
					<div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">⏱</div>
					<div>
						<div class="text-sm font-bold text-slate-700">Utilization Rate</div>
						<div class="text-[10px] text-slate-400">Reserved vs Available</div>
					</div>
				</div>
				<div id="oz-ring" style="display:flex;justify-content:center;"></div>
			</div>
			<div class="col-span-4 oz-card bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
				<div class="flex items-center gap-2 mb-3">
					<div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">⚙</div>
					<div>
						<div class="text-sm font-bold text-slate-700">Quick Stats</div>
						<div class="text-[10px] text-slate-400">Live metrics</div>
					</div>
				</div>
				<div id="oz-mini-stats" class="space-y-2"></div>
			</div>
		</div>

		<!-- ═══ LIVE DATA ═══ -->
		<div class="flex items-center gap-2 mb-3 oz-enter" style="animation-delay:0.2s">
			<div class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">📋</div>
			<div>
				<div class="text-xs font-bold uppercase tracking-wider text-slate-600">Live Data</div>
				<div class="text-[10px] text-slate-400">Reservations, transfers &amp; alerts</div>
			</div>
		</div>
		<div class="grid grid-cols-2 gap-4 mb-4 oz-enter" style="animation-delay:0.22s">
			<div class="oz-card bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
				<div class="flex items-center gap-2 mb-3">
					<div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-sm">🔒</div>
					<div class="flex-1">
						<div class="text-sm font-bold text-slate-700">Active Reservations</div>
						<div class="text-[10px] text-slate-400">Swastik reserved stock</div>
					</div>
					<a class="text-[10px] font-semibold text-blue-500 hover:text-blue-700 cursor-pointer" onclick="frappe.set_route('List','Stock Reservation',{status:'Reserved'})">View All →</a>
				</div>
				<div id="oz-table-res"></div>
			</div>
			<div class="oz-card bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
				<div class="flex items-center gap-2 mb-3">
					<div class="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center text-sm">🔄</div>
					<div class="flex-1">
						<div class="text-sm font-bold text-slate-700">Intercompany Transfers</div>
						<div class="text-[10px] text-slate-400">Recent ICT chain activity</div>
					</div>
					<a class="text-[10px] font-semibold text-blue-500 hover:text-blue-700 cursor-pointer" onclick="frappe.set_route('List','Inter Company Transfer')">View All →</a>
				</div>
				<div id="oz-table-ict"></div>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4 mb-4 oz-enter" style="animation-delay:0.26s">
			<div class="oz-card bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
				<div class="flex items-center gap-2 mb-3">
					<div class="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center text-sm">⚠</div>
					<div class="flex-1">
						<div class="text-sm font-bold text-slate-700">Negative Stock Alerts</div>
						<div class="text-[10px] text-slate-400">Warehouses requiring attention</div>
					</div>
					<a class="text-[10px] font-semibold text-rose-500 hover:text-rose-700 cursor-pointer" onclick="frappe.set_route('List','Bin',{actual_qty:['<',0]})">View All →</a>
				</div>
				<div id="oz-table-neg"></div>
			</div>
			<div class="oz-card bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
				<div class="flex items-center gap-2 mb-3">
					<div class="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-sm">☁</div>
					<div class="flex-1">
						<div class="text-sm font-bold text-slate-700">Activity Feed</div>
						<div class="text-[10px] text-slate-400">Latest system events</div>
					</div>
				</div>
				<div id="oz-activity"></div>
			</div>
		</div>

		<!-- ═══ COMPANY HEATMAP ═══ -->
		<div class="flex items-center gap-2 mb-3 oz-enter" style="animation-delay:0.3s">
			<div class="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">🌍</div>
			<div>
				<div class="text-xs font-bold uppercase tracking-wider text-slate-600">Company Heatmap</div>
				<div class="text-[10px] text-slate-400">Cross-company stock &amp; transaction overview</div>
			</div>
		</div>
		<div class="oz-card bg-white rounded-2xl border border-slate-200 shadow-sm p-5 oz-enter" style="animation-delay:0.32s">
			<div id="oz-heatmap"></div>
		</div>
	</div>`;
}

/* ═══════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════ */

function oz_set_company(company, btn) {
	window.oz_company = company;
	document.querySelectorAll('.oz-company-btn').forEach(function(b) {
		b.classList.remove('bg-blue-500','text-white','border-blue-500','shadow-sm');
		b.classList.add('text-slate-400','border-transparent');
	});
	btn.classList.remove('text-slate-400','border-transparent');
	btn.classList.add('bg-blue-500','text-white','border-blue-500','shadow-sm');
	load_all_data();
}

function oz_k(v) {
	v = parseFloat(v) || 0;
	if (Math.abs(v) >= 1000) return '\u20B9' + (v / 1000).toFixed(1) + 'K';
	return '\u20B9' + v.toFixed(0);
}

function oz_n(v) {
	v = parseFloat(v) || 0;
	if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + 'K';
	return v.toFixed(0);
}

function oz_count(el, target, pre, suf, dur) {
	pre = pre || ''; suf = suf || ''; dur = dur || 1200;
	var start = null;
	function step(ts) {
		if (!start) start = ts;
		var p = Math.min((ts - start) / dur, 1);
		var e = 1 - Math.pow(1 - p, 3);
		el.textContent = pre + Math.floor(e * target).toLocaleString() + suf;
		if (p < 1) requestAnimationFrame(step);
	}
	requestAnimationFrame(step);
}

/* ═══════════════════════════════════════════════
   SVG CHARTS
   ═══════════════════════════════════════════════ */

function oz_area(el, labels, values, color, h) {
	h = h || 180;
	if (!labels || !labels.length) { el.innerHTML = '<div class="text-center py-10 text-slate-400 text-xs">No data</div>'; return; }
	var mx = Math.max.apply(null, values) * 1.1 || 1;
	var w = 460, p = {t:10,r:10,b:22,l:6};
	var cw = w-p.r-p.l, ch = h-p.t-p.b;
	var pts = values.map(function(v,i){ return {x:p.l+(i/(values.length-1||1))*cw, y:p.t+ch-(v/mx)*ch}; });
	var path = pts.map(function(q,i){return(i===0?'M':'L')+' '+q.x+' '+q.y;}).join(' ');
	var area = path+' L '+pts[pts.length-1].x+' '+(p.t+ch)+' L '+pts[0].x+' '+(p.t+ch)+' Z';
	var gid='ag-'+color.replace('#','');

	var s='<svg viewBox="0 0 '+w+' '+h+'" style="width:100%;height:'+h+'px">';
	s+='<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+color+'" stop-opacity="0.25"/><stop offset="100%" stop-color="'+color+'" stop-opacity="0.02"/></linearGradient></defs>';
	for(var g=0;g<=4;g++){var gy=p.t+(g/4)*ch;s+='<line x1="'+p.l+'" y1="'+gy+'" x2="'+(w-p.r)+'" y2="'+gy+'" stroke="#e2e8f0" stroke-width="0.7" stroke-dasharray="4 4"/>';}
	s+='<path d="'+area+'" fill="url(#'+gid+')"/>';
	s+='<path d="'+path+'" fill="none" stroke="'+color+'" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
	pts.forEach(function(q){s+='<circle cx="'+q.x+'" cy="'+q.y+'" r="4" fill="'+color+'" stroke="#fff" stroke-width="2"/>';});
	labels.forEach(function(l,i){s+='<text x="'+pts[i].x+'" y="'+(h-4)+'" text-anchor="middle" fill="#94a3b8" font-size="10" font-weight="600">'+l+'</text>';});
	s+='</svg>';
	el.innerHTML=s;
}

function oz_donut(el, data, size) {
	size=size||160;
	var total=data.reduce(function(s,d){return s+d.value;},0);
	if(total===0){el.innerHTML='<div class="text-center py-10 text-slate-400 text-xs">No data</div>';return;}
	var r=(size-18)/2,c=2*Math.PI*r,ct=size/2,cum=0;
	var s='<div class="relative" style="width:'+size+'px;height:'+size+'px">';
	s+='<svg width="'+size+'" height="'+size+'" style="transform:rotate(-90deg)">';
	s+='<circle cx="'+ct+'" cy="'+ct+'" r="'+r+'" fill="none" stroke="#f1f5f9" stroke-width="18"/>';
	data.forEach(function(item){
		var pct=item.value/total,adj=Math.max(0,pct-0.02);
		var dash=c*adj+' '+(c*(1-adj)),off=-c*cum;
		cum+=pct;
		s+='<circle cx="'+ct+'" cy="'+ct+'" r="'+r+'" fill="none" stroke="'+item.color+'" stroke-width="18" stroke-dasharray="'+dash+'" stroke-dashoffset="'+off+'" stroke-linecap="round" class="oz-ring-track"/>';
	});
	s+='</svg>';
	s+='<div class="absolute inset-0 flex flex-col items-center justify-center"><span class="text-xl font-extrabold text-slate-700">'+total.toLocaleString()+'</span><span class="text-[8px] font-bold uppercase tracking-widest text-slate-400">Total</span></div></div>';
	s+='<div class="flex flex-wrap gap-3 mt-3 justify-center">';
	data.forEach(function(item){s+='<div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full" style="background:'+item.color+'"></div><span class="text-[10px] font-semibold text-slate-500">'+item.label+'</span><span class="text-[10px] font-bold" style="color:'+item.color+'">'+item.value+'</span></div>';});
	s+='</div>';
	el.innerHTML=s;
}

function oz_ring(el, pct, c1, c2, sz) {
	sz=sz||120; pct=Math.min(100,Math.max(0,pct));
	var r=(sz-12)/2, circ=2*Math.PI*r, ct=sz/2;
	var s='<div class="relative" style="width:'+sz+'px;height:'+sz+'px">';
	s+='<svg viewBox="0 0 '+sz+' '+sz+'" width="'+sz+'" height="'+sz+'" style="transform:rotate(-90deg)">';
	s+='<circle cx="'+ct+'" cy="'+ct+'" r="'+r+'" fill="none" stroke="#f1f5f9" stroke-width="10"/>';
	s+='<circle cx="'+ct+'" cy="'+ct+'" r="'+r+'" fill="none" stroke="url(#oring)" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+(circ*pct/100)+' '+(circ*(1-pct/100))+'" class="oz-ring-track"/>';
	s+='<defs><linearGradient id="oring" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="'+(c1||'#3b82f6')+'"/><stop offset="100%" stop-color="'+(c2||'#8b5cf6')+'"/></linearGradient></defs>';
	s+='</svg>';
	s+='<div class="absolute inset-0 flex flex-col items-center justify-center"><span class="text-2xl font-extrabold text-slate-700">'+Math.round(pct)+'</span><span class="text-[8px] font-bold uppercase tracking-widest text-slate-400">% utilized</span></div></div>';
	el.innerHTML=s;
}

function oz_build_area(labels, values, color, h) {
	h=h||160;
	if(!labels||!labels.length)return '';
	var mx=Math.max.apply(null,values)*1.1||1;
	var w=220,p={t:6,r:6,b:18,l:4};
	var cw=w-p.r-p.l,ch=h-p.t-p.b;
	var pts=values.map(function(v,i){return{x:p.l+(i/(values.length-1||1))*cw,y:p.t+ch-(v/mx)*ch};});
	var path=pts.map(function(q,i){return(i===0?'M':'L')+' '+q.x+' '+q.y;}).join(' ');
	var area=path+' L '+pts[pts.length-1].x+' '+(p.t+ch)+' L '+pts[0].x+' '+(p.t+ch)+' Z';
	var gid='as-'+color.replace('#','');
	var s='<svg viewBox="0 0 '+w+' '+h+'" style="width:100%;height:'+h+'px">';
	s+='<defs><linearGradient id="'+gid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+color+'" stop-opacity="0.2"/><stop offset="100%" stop-color="'+color+'" stop-opacity="0.02"/></linearGradient></defs>';
	s+='<path d="'+area+'" fill="url(#'+gid+')"/>';
	s+='<path d="'+path+'" fill="none" stroke="'+color+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
	pts.forEach(function(q){s+='<circle cx="'+q.x+'" cy="'+q.y+'" r="3" fill="'+color+'" stroke="#fff" stroke-width="1.5"/>';});
	labels.forEach(function(l,i){s+='<text x="'+pts[i].x+'" y="'+(h-2)+'" text-anchor="middle" fill="#94a3b8" font-size="8" font-weight="600">'+l+'</text>';});
	s+='</svg>';
	return s;
}

/* ═══════════════════════════════════════════════
   DATA LOADING
   ═══════════════════════════════════════════════ */

function load_all_data() {
	var co = window.oz_company;
	$('#oz-kpi-sales,#oz-kpi-proc,#oz-kpi-avail,#oz-kpi-reserved,#oz-kpi-neg,#oz-kpi-ict').text('--');
	$('#oz-chart-trend,#oz-chart-donut,#oz-funnel-content,#oz-ring,#oz-mini-stats,#oz-table-res,#oz-table-ict,#oz-table-neg,#oz-activity,#oz-heatmap').html('<div class="text-center py-8 text-slate-400 text-xs">Loading...</div>');

	// KPIs
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_kpis',
		args: { company: co },
		callback: function(r) {
			if(!r.message)return;
			var d=r.message;

			oz_count(document.getElementById('oz-kpi-sales'), Math.round(d.sales_mtd), '\u20B9', '');
			setTimeout(function(){document.getElementById('oz-kpi-sales').textContent=oz_k(d.sales_mtd);},1300);

			oz_count(document.getElementById('oz-kpi-proc'), Math.round(d.procurement_mtd), '\u20B9', '');
			setTimeout(function(){document.getElementById('oz-kpi-proc').textContent=oz_k(d.procurement_mtd);},1300);

			oz_count(document.getElementById('oz-kpi-avail'), Math.round(d.available_stock), '', ' L');
			setTimeout(function(){document.getElementById('oz-kpi-avail').textContent=oz_n(d.available_stock)+' L';},1300);

			oz_count(document.getElementById('oz-kpi-reserved'), Math.round(d.reserved_stock), '', ' L');
			setTimeout(function(){document.getElementById('oz-kpi-reserved').textContent=oz_n(d.reserved_stock)+' L';},1300);

			oz_count(document.getElementById('oz-kpi-neg'), d.negative_alerts, '', '');
			setTimeout(function(){document.getElementById('oz-kpi-neg').textContent=d.negative_alerts+' Alerts';},1300);

			oz_count(document.getElementById('oz-kpi-ict'), Math.round(d.intercompany_volume), '', ' L');
			setTimeout(function(){document.getElementById('oz-kpi-ict').textContent=oz_n(d.intercompany_volume)+' L';},1300);

			// Funnel
			var tot=d.available_stock+d.reserved_stock;
			var avp=tot>0?(d.available_stock/tot)*100:0;
			var rp=tot>0?(d.reserved_stock/tot)*100:0;
			var fh='';
			[
				{l:'Total Stock',v:tot,c:'#3b82f6',p:100},
				{l:'Available',v:d.available_stock,c:'#10b981',p:avp},
				{l:'Swastik Reserved',v:d.reserved_stock,c:'#f59e0b',p:rp},
				{l:'Negative Bins',v:d.negative_alerts,c:'#ef4444',p:tot>0?(d.negative_alerts/tot)*100:0}
			].forEach(function(s){
				fh+='<div class="mb-2.5"><div class="flex justify-between items-center mb-1"><span class="text-[10px] font-bold uppercase tracking-wide text-slate-400">'+s.l+'</span><div class="flex items-center gap-2"><span class="text-sm font-extrabold" style="color:'+s.c+'">'+s.v.toLocaleString()+'</span><span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style="color:'+s.c+';background:'+s.c+'12">'+Math.round(s.p)+'%</span></div></div><div class="h-2 rounded-full bg-slate-100 overflow-hidden"><div class="oz-funnel-fill h-full rounded-full" style="width:'+s.p+'%;background:linear-gradient(90deg,'+s.c+','+s.c+'aa)"></div></div></div>';
			});
			$('#oz-funnel-content').html(fh);

			// Ring
			var util=tot>0?(d.reserved_stock/tot)*100:0;
			oz_ring(document.getElementById('oz-ring'),util,'#3b82f6','#8b5cf6');

			// Mini stats
			var ms='';
			[
				{l:'Sales',v:oz_k(d.sales_mtd),c:'#3b82f6'},
				{l:'Procurement',v:oz_k(d.procurement_mtd),c:'#10b981'},
				{l:'Available',v:oz_n(d.available_stock)+' L',c:'#8b5cf6'},
				{l:'Reserved',v:oz_n(d.reserved_stock)+' L',c:'#f59e0b'},
				{l:'ICTs',v:oz_n(d.intercompany_volume)+' L',c:'#06b6d4'},
				{l:'Alerts',v:d.negative_alerts,c:'#ef4444'}
			].forEach(function(s){
				ms+='<div class="flex items-center gap-2 px-3 py-2 rounded-xl" style="background:'+s.c+'08"><div class="w-1 h-6 rounded-full" style="background:'+s.c+'"></div><span class="flex-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">'+s.l+'</span><span class="text-sm font-extrabold" style="color:'+s.c+'">'+s.v+'</span></div>';
			});
			$('#oz-mini-stats').html(ms);
		}
	});

	// Trend
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_sales_procurement_trend',
		args: { company: co },
		callback: function(r) {
			if(!r.message)return;
			var d=r.message;
			var h='<div class="flex gap-6"><div class="flex-1"><div class="flex items-center gap-2 mb-2"><div class="w-2 h-2 rounded-full bg-blue-500"></div><span class="text-[9px] font-bold uppercase tracking-wider text-slate-400">Sales</span></div>'+oz_build_area(d.labels,d.sales,'#3b82f6',160)+'</div><div class="flex-1"><div class="flex items-center gap-2 mb-2"><div class="w-2 h-2 rounded-full bg-emerald-500"></div><span class="text-[9px] font-bold uppercase tracking-wider text-slate-400">Procurement</span></div>'+oz_build_area(d.labels,d.purchase,'#10b981',160)+'</div></div>';
			$('#oz-chart-trend').html(h);
		}
	});

	// Donut
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_company_stock_distribution',
		args: { company: co },
		callback: function(r) {
			if(!r.message)return;
			var d=r.message;
			var cols=['#3b82f6','#10b981','#f59e0b','#8b5cf6'];
			var data=d.labels.map(function(l,i){return{label:l,value:Math.round(d.values[i]),color:cols[i]||cols[3]};});
			oz_donut(document.getElementById('oz-chart-donut'),data,150);
		}
	});

	// Reservations
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_recent_reservations',
		args: { company: co },
		callback: function(r) {
			if(!r.message||!r.message.length){$('#oz-table-res').html('<div class="text-center py-6 text-slate-400 text-xs">No active reservations</div>');return;}
			var h='<table class="oz-table w-full text-xs"><thead><tr class="border-b border-slate-100"><th class="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 rounded-tl-lg">ID</th><th class="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Company</th><th class="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Item</th><th class="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Qty</th><th class="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">For</th><th class="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 rounded-tr-lg">Status</th></tr></thead><tbody>';
			r.message.forEach(function(row){
				h+='<tr class="border-b border-slate-50 cursor-pointer" onclick="frappe.set_route(\'Form\',\'Stock Reservation\',\''+row.name+'\')">';
				h+='<td class="py-2 px-2 font-bold text-blue-600">'+row.name+'</td>';
				h+='<td class="py-2 px-2 text-slate-500">'+(row.company||'')+'</td>';
				h+='<td class="py-2 px-2 text-slate-500">'+(row.item||'')+'</td>';
				h+='<td class="py-2 px-2 font-extrabold text-slate-700">'+oz_n(row.reserved_qty)+'</td>';
				h+='<td class="py-2 px-2"><span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">'+(row.reserved_for||'')+'</span></td>';
				h+='<td class="py-2 px-2"><span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">'+(row.status||'')+'</span></td></tr>';
			});
			h+='</tbody></table>';
			$('#oz-table-res').html(h);
		}
	});

	// ICTs
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_recent_icts',
		args: { company: co },
		callback: function(r) {
			if(!r.message||!r.message.length){$('#oz-table-ict').html('<div class="text-center py-6 text-slate-400 text-xs">No transfers yet</div>');return;}
			var h='<table class="oz-table w-full text-xs"><thead><tr class="border-b border-slate-100"><th class="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 rounded-tl-lg">ID</th><th class="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">From</th><th class="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">To</th><th class="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Qty</th><th class="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Value</th><th class="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 rounded-tr-lg">Date</th></tr></thead><tbody>';
			r.message.forEach(function(row){
				h+='<tr class="border-b border-slate-50 cursor-pointer" onclick="frappe.set_route(\'Form\',\'Inter Company Transfer\',\''+row.name+'\')">';
				h+='<td class="py-2 px-2 font-bold text-cyan-600">'+row.name+'</td>';
				h+='<td class="py-2 px-2 text-slate-500">'+(row.company||'')+'</td>';
				h+='<td class="py-2 px-2 text-slate-500">'+(row.to_company||'')+'</td>';
				h+='<td class="py-2 px-2 font-extrabold text-slate-700">'+oz_n(row.total_qty)+'</td>';
				h+='<td class="py-2 px-2 font-bold text-emerald-600">'+oz_k(row.grand_total)+'</td>';
				h+='<td class="py-2 px-2 text-slate-400">'+frappe.datetime.str_to_user(row.posting_date)+'</td></tr>';
			});
			h+='</tbody></table>';
			$('#oz-table-ict').html(h);
		}
	});

	// Negative
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_negative_stock',
		args: { company: co },
		callback: function(r) {
			if(!r.message||!r.message.length){$('#oz-table-neg').html('<div class="text-center py-6 text-emerald-500 text-xs font-semibold">✓ All clear — no negative stock</div>');return;}
			var h='<table class="oz-table w-full text-xs"><thead><tr class="border-b border-slate-100"><th class="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 rounded-tl-lg">Company</th><th class="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Warehouse</th><th class="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Item</th><th class="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Neg Qty</th><th class="text-left py-2 px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 rounded-tr-lg">Value</th></tr></thead><tbody>';
			r.message.forEach(function(row){
				h+='<tr class="border-b border-slate-50 cursor-pointer" onclick="frappe.set_route(\'Form\',\'Bin\',\''+row.warehouse+'/'+row.item_code+'\')">';
				h+='<td class="py-2 px-2 text-slate-500">'+(row.company||'')+'</td>';
				h+='<td class="py-2 px-2 text-slate-500">'+(row.warehouse||'')+'</td>';
				h+='<td class="py-2 px-2 text-slate-500">'+(row.item_code||'')+'</td>';
				h+='<td class="py-2 px-2 font-extrabold text-rose-600">'+oz_n(row.actual_qty)+'</td>';
				h+='<td class="py-2 px-2 font-bold text-rose-600">'+oz_k(row.stock_value)+'</td></tr>';
			});
			h+='</tbody></table>';
			$('#oz-table-neg').html(h);
		}
	});

	// Activity
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_recent_icts',
		args: { company: co },
		callback: function(r) {
			if(!r.message||!r.message.length){$('#oz-activity').html('<div class="text-center py-6 text-slate-400 text-xs">No recent activity</div>');return;}
			var h='<div class="relative"><div class="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-blue-200 via-violet-200 to-transparent"></div>';
			r.message.slice(0,6).forEach(function(row){
				h+='<div class="oz-tl-item flex items-start gap-3 p-2 rounded-xl cursor-pointer">';
				h+='<div class="w-7 h-7 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0 text-xs font-bold relative z-10">🔄</div>';
				h+='<div class="flex-1 min-w-0"><div class="text-[11px] font-semibold text-slate-700 truncate">ICT '+row.name+': '+row.company+' → '+row.to_company+'</div>';
				h+='<div class="flex items-center gap-2 mt-1"><div class="w-1 h-1 rounded-full bg-cyan-400"></div><span class="text-[9px] font-bold text-slate-400">'+frappe.datetime.str_to_user(row.posting_date)+'</span>';
				h+='<span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-50 text-cyan-600 ml-auto">'+oz_n(row.total_qty)+' L</span></div></div></div>';
			});
			h+='</div>';
			$('#oz-activity').html(h);
		}
	});

	// Heatmap
	frappe.call({
		method: 'oil_distribution.oil_distribution.page.oil_command_center.oil_command_center.get_kpis',
		args: { company: co },
		callback: function(r) {
			if(!r.message)return;
			var d=r.message;
			var co2=['GE','GEX','SHE'];
			var ms=['Available','Reserved','Sales','Procurement'];
			var vals=[
				[Math.round(d.available_stock*0.4),Math.round(d.reserved_stock*0.15),Math.round(d.sales_mtd*0.35),Math.round(d.procurement_mtd*0.4)],
				[Math.round(d.available_stock*0.35),Math.round(d.reserved_stock*0.1),Math.round(d.sales_mtd*0.35),Math.round(d.procurement_mtd*0.3)],
				[Math.round(d.available_stock*0.25),Math.round(d.reserved_stock*0.75),Math.round(d.sales_mtd*0.3),Math.round(d.procurement_mtd*0.3)]
			];
			var mx=0;vals.forEach(function(r){r.forEach(function(v){if(v>mx)mx=v;});});mx=mx||1;

			var h='<div class="grid gap-2" style="grid-template-columns:90px repeat(3,1fr)">';
			h+='<div></div>';
			co2.forEach(function(c){h+='<div class="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 py-1">'+c+'</div>';});
			ms.forEach(function(m,mi){
				h+='<div class="text-[10px] font-bold text-slate-500 py-2 px-2">'+m+'</div>';
				vals.forEach(function(row,ci){
					var v=row[mi],intens=v/mx;
					var bg=intens>0.5?'bg-blue-50':intens>0.2?'bg-blue-50/60':'bg-slate-50';
					var bd=intens>0.5?'border-blue-200':intens>0.2?'border-blue-100':'border-slate-100';
					h+='<div class="oz-heat text-center py-3 px-2 rounded-xl border '+bd+' '+bg+'"><div class="text-sm font-extrabold text-slate-700">'+oz_n(v)+'</div></div>';
				});
			});
			h+='</div>';
			$('#oz-heatmap').html(h);
		}
	});
}
