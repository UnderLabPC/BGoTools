/** GoogleTools.js
 *  Version: 0.1.3
 *  Date:    20 Juli 2024
 ** Description:
 *      Google Tag Manager (GTM) dan Google Analytics 4 (GA4), implementasi untuk blogger.
 *      Inisialisasi otomatis saat DOM siap (DOMContentLoaded), tersedia beberapa tambahan
 *      fungsi/prosedur untuk:
 *      - pelacakan event (seperti klik, download, dll).
 *      - menonaktifkan beberapa fitur seperti klik kanan, shortcut keyboard, dan seleksi teks.
 ** kompatibilitas browser modern (Chrome, Firefox, Safari, Edge).
 *
 *  by TheFrieLancr Ankshana, https://github.com/TheFrielancr
 ** License: X11/MIT
 *      see https://github.com/UnderLabPC/BGoTools/blob/main/LICENSE
 */ var modFiles = 'GoogleTools.js';
var modNames = 'GoogleTools';
class googleTools {
	#GA4ary = ['6XL2SF1VTV','7MP1DX20Y4','95Q4YSW2R8','NNJ3SY90V2','XX75Y5Q3G9'];
	#GTMary = ['','PPV28C8F','','NK7XZW6D',''];
	#GTaray = ['M6P5MP75','WPL8BPHP','WRF7WS7V','NNXBK82D','KDBG37D3'];
	constructor(_ga4, _gtm, _cfg = {}) {
		this.config = {
			ga4Id: _ga4 || `G-${GA4ary[1]}`,
			ga4Dt: _ga4 || `GT-${GA4ary[1]}`,
			gtmId: _gtm || `GTM-${GTMary[1]}`,
			dataLayer: window.dataLayer || [],
			..._cfg
		};
		window.dataLayer = this.config.dataLayer;
		this.jqExists = typeof (window.jQuery||jQuery||$) !== 'undefined';
		this.evtClick = ('ontouchstart' in window)?'touchstart':'click';
		this.evtClkDb = ('ondblclick' in document)?'dblclick':'click';
	}
/** inject GTM script **/
	#injGTM() {
		//> skip if is GTM already
	  if (document.querySelector(`script[src*="gtm.js?id=${this.config.gtmId}"]`))
		return;
		//> normal GTM
		const gtmScript = document.createElement('script');
		const chcBuster = Date.now();
		gtmScript.innerHTML = `
			(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
			var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
			j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl+'&cb=${chcBuster}';
			f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${this.config.gtmId}');
		`;	document.head.prepend(gtmScript);
		//> noscript GTM fallback
		const gtmNoscript = document.createElement('noscript');
		gtmNoscript.innerHTML = `
			<iframe src="https://www.googletagmanager.com/ns.html?id=${this.config.gtmId}&cb=${chcBuster}"
					height="0" width="0" style="display:none;visibility:hidden"></iframe>
		`;	document.body.prepend(gtmNoscript);
	}
/** inject GA4 script **/
	#injGA4() {
		//> skip if is GA4 already
	  if (document.querySelector(`script[src*="gtag/js?id=${this.config.ga4Id}"]`))
		return;
		const gaScript = document.createElement('script');
		gaScript.async = true;gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.ga4Id}`;
		document.head.appendChild(gaScript);
		//> initialize GA4
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({'gtm.start': new Date().getTime(),event: 'gtm.js'});
//		window.gtag = function() {window.dataLayer.push(arguments);};
		window.gtag = window.gtag || function() {dataLayer.push(arguments);};
		gtag('js', new Date());gtag('config', this.config.ga4Id);
	}
/** jQuery supported event tracking **/
	jqTrack_(eventType, selector, category, action, label) {
	  if (!this.jqExists) return;
		jQuery(document).on(eventType, selector, (e) => {
			this.trackEvent(action, category, label || e.target.innerText);
		});
	}
/** auto-tracking events **/
	#setupAutoTracking() {
		//> auto-track external/track outbound links
		document.addEventListener(this.evtClick, (e) => {
			const link = e.target.closest('a');
		  if (!link) return;
			const href = link.href;
		  if (!href) return;
		//> external link detection
		const isExternal = !href.includes(window.location.hostname) && 
						   !href.startsWith('javascript:') && 
						   !href.startsWith('#');
		//> file download detection
		const fileTypes = ['pdf','pps','ppt','pptx','doc','docx','xla','xlam','xls','xlsm','xlsx','cab','zip','zipx','rar','7z'];
		const ext = href.split('.').pop().toLowerCase();
		  if (isExternal) {
			this.trackEvent('engagement', 'outbound_click', href);
		  }else if (fileTypes.includes(ext)) {
			this.trackEvent('engagement', 'file_download', `${ext.toUpperCase()}|${href}`);
		  }
		});
	}
/** helper: jQuery auto-event bindings **/
	#bindAutoEvents() {
	  if (!this.jqExists) return;
		const $ = window.jQuery || jQuery;
		//> blog-specific events
		$('.post-title a').on('click', (e) => {
			this.trackEvent('blog_navigation', 'post_click', e.target.href);
		});
		$('.blog-pager-older-link, .blog-pager-newer-link').on('click', (e) => {
			const type = e.target.className.includes('older') ? 'older_posts' : 'newer_posts';
			this.trackEvent('pagination', type, window.location.pathname);
		});
	}
/** events tracking */
	trackEvent(action, category, label, value) {
	  if (window.gtag) {
		gtag('event', action, {
			event_category: category,
			event_label: label,
			value: value
		});
	  }	this.config.dataLayer.push({
			event: 'GAEvent',
			eventCategory: category,
			eventAction: action,
			eventLabel: label,
			eventValue: value
		});
	}
/** page view tracking */
	trackPageView(path) {
		const pagePath = path || window.location.pathname + window.location.search;
	  if (window.gtag) {
		gtag('config', this.config.ga4Id, {page_path: pagePath});
	  }	this.config.dataLayer.push({
		event: 'virtualPageView',
		pagePath: pagePath
		});
	}
/** disable right click **/
	dsbRightClick() {
		document.addEventListener('contextmenu', e => e.preventDefault());
	}
/** disable shortcut keyborad **/
	dsbKeyboardSC() {
		document.addEventListener('keydown', e => {
		  if (e.ctrlKey && [67, 88, 85, 86].includes(e.keyCode)) {e.preventDefault();}
		});
	}
/** disable text selection **/
	dsbTextSelect() {
	  if (!this.jqExists) {
		var slcEvent = ['cut','copy','drag','dragstart','drop','dropover','paste','contextmenu'];
		slcEvent.forEach(evt => {
			document.addEventListener(evt, e => e.preventDefault());
		});
	  }else {
		jQuery(document).on('cut copy drag dragstart drop dropover paste contextmenu', e => e.preventDefault());
	  }
	}
/** inisialisasi **/
	_init_() {
	  try {
		this.#injGTM();
		this.#injGA4();
		this.#setupAutoTracking();
		//> inisialisasi spesifik pada blogger
		this.trackPageView();
		this.trackEvent('blog', 'page_view', 'blog_page');
		  if (this.jqExists) {
		this.#bindAutoEvents();
		  }
	  }catch(err) {
		console.error(`${modNames} initialization error: `, err);
	  }
	}
}
/** inisialisasi otomatis untuk Blogger/Blogspot
 */ document.addEventListener('DOMContentLoaded', () => {
	const toolsGoo = new googleTools();
	toolsGoo._init_();
	// jika jQuery tersedia (Blogger biasanya menyertakan jQuery)
  if (toolsGoo.jqExists) {
	toolsGoo.jqTrack_('click', '.post-title a', 'Blog Navigation', 'Post Click');
	toolsGoo.jqTrack_('click', '.blog-pager-older-link', 'Pagination', 'Older Posts');
	toolsGoo.jqTrack_('click', '.blog-pager-newer-link', 'Pagination', 'Newer Posts');
  }
});
