/**
 * Sailup API Client SDK for HTU Welfare System
 * Base URL: https://api.sailup.io/v1
 *
 * Supports SMS dispatching, Contact management, and List Segmentation.
 */

const SAILUP_BASE_URL = 'https://api.sailup.io/v1';

const getApiKey = () => process.env.SAILUP_API_KEY || 'sailup_v8xXqOHrgAEhUTVBkFXJ_9iTgtDDcGMWQKFl4v74mUQ';
const getDefaultSender = () => process.env.SAILUP_DEFAULT_SENDER || 'HTUWELFARE';

/**
 * Generic fetch helper for Sailup REST API
 */
async function request(endpoint, options = {}) {
  const apiKey = getApiKey();

  let formattedEndpoint = endpoint;
  if (!formattedEndpoint.includes('?') && !formattedEndpoint.endsWith('/')) {
    formattedEndpoint += '/';
  } else if (formattedEndpoint.includes('?')) {
    const [path, query] = formattedEndpoint.split('?');
    const cleanPath = path.endsWith('/') ? path : `${path}/`;
    formattedEndpoint = `${cleanPath}?${query}`;
  }

  const url = `${SAILUP_BASE_URL}${formattedEndpoint}`;
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 204) {
    return { success: true, statusCode: 204 };
  }

  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || `Sailup API error (${response.status}): ${response.statusText}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const sailup = {
  // ==========================================
  // SMS ENDPOINTS
  // ==========================================

  async sendSMS({ from, to, body }) {
    const sender = from || getDefaultSender();
    const recipientList = Array.isArray(to) ? to : [to];
    return await request('/sms/', {
      method: 'POST',
      body: JSON.stringify({ from: sender, to: recipientList, body })
    });
  },

  async listSMS({ limit = 20, offset = 0 } = {}) {
    return await request(`/sms/?limit=${limit}&offset=${offset}`, { method: 'GET' });
  },

  async getSMS(messageId) {
    return await request(`/sms/${messageId}/`, { method: 'GET' });
  },

  // ==========================================
  // CONTACTS ENDPOINTS
  // ==========================================

  async listContacts({ search, opted_in, limit = 20, offset = 0 } = {}) {
    const query = new URLSearchParams();
    query.set('limit', limit.toString());
    query.set('offset', offset.toString());
    if (search) query.set('search', search);
    if (typeof opted_in === 'boolean') query.set('opted_in', opted_in.toString());
    return await request(`/contacts/?${query.toString()}`, { method: 'GET' });
  },

  async createContact(contactData) {
    return await request('/contacts/', { method: 'POST', body: JSON.stringify(contactData) });
  },

  async getContact(contactId) {
    return await request(`/contacts/${contactId}/`, { method: 'GET' });
  },

  async updateContact(contactId, updates) {
    return await request(`/contacts/${contactId}/`, { method: 'PATCH', body: JSON.stringify(updates) });
  },

  async deleteContact(contactId) {
    return await request(`/contacts/${contactId}/`, { method: 'DELETE' });
  },

  async bulkUpsertContacts(contacts) {
    return await request('/contacts/bulk/', { method: 'POST', body: JSON.stringify({ contacts }) });
  },

  // ==========================================
  // LISTS ENDPOINTS
  // ==========================================

  async listLists({ limit = 20, offset = 0 } = {}) {
    return await request(`/lists/?limit=${limit}&offset=${offset}`, { method: 'GET' });
  },

  async createList({ name, description = '' }) {
    return await request('/lists/', { method: 'POST', body: JSON.stringify({ name, description }) });
  },

  async getList(listId) {
    return await request(`/lists/${listId}/`, { method: 'GET' });
  },

  async updateList(listId, updates) {
    return await request(`/lists/${listId}/`, { method: 'PATCH', body: JSON.stringify(updates) });
  },

  async deleteList(listId) {
    return await request(`/lists/${listId}/`, { method: 'DELETE' });
  },

  async listListContacts(listId, { limit = 20, offset = 0 } = {}) {
    return await request(`/lists/${listId}/contacts/?limit=${limit}&offset=${offset}`, { method: 'GET' });
  },

  async addContactsToList(listId, contactIds) {
    return await request(`/lists/${listId}/contacts/`, { method: 'POST', body: JSON.stringify({ contact_ids: contactIds }) });
  },

  async removeContactFromList(listId, contactId) {
    return await request(`/lists/${listId}/contacts/${contactId}/`, { method: 'DELETE' });
  }
};
