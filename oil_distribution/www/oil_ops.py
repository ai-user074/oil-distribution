import frappe

no_cache = 1


def get_context(context):
	csrf_token = frappe.sessions.get_csrf_token()
	frappe.db.commit()
	context.csrf_token = csrf_token
	context.boot = frappe._dict({
		"site_name": frappe.local.site,
		"csrf_token": csrf_token,
		"lang": frappe.local.lang,
	})
	return context
