/**
 * Sailup API Client SDK for HTU Welfare System
 * Base URL: https://api.sailup.io/v1
 * 
 * Supports SMS dispatching, Contact management, and List Segmentation.
 */

const SAILUP_BASE_URL = 'https://api.sailup.io/v1';

const getApiKey = () => process.env.SAILUP_API_KEY || '';
const getDefaultSender = () => process.env.SAILUP_DEFAULT_SENDER || 'HTUWelfare';

/**
 * Generic fetch helper for Sailup REST API
 */
async function request(endpoint, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('SAILUP_API_KEY environment variable is not configured');
  }

  // Ensure trailing slash on endpoints as required by Sailup API spec
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

  const response = await fetch(url, {
    ...options,
    headers
  });

  // Handle 204 No Content
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
  /**
   * Check if Sailup API credentials are set
   */
  isConfigured() {
    return !!getApiKey();
  },

  // ==========================================
  // SMS ENDPOINTS
  // ==========================================

  /**
   * Send SMS to one or more recipients
   * @param {Object} params
   * @param {string} [params.from] Registered sender ID (defaults to SAILUP_DEFAULT_SENDER env)
   * @param {string[]} params.to Array of destination phone numbers (local e.g. "0201234567" or E.164 e.g. "+233201234567")
   * @param {string} params.body Message text
   */
  async sendSMS({ from, to, body }) {
    const sender = from || getDefaultSender();
    const recipientList = Array.isArray(to) ? to : [to];

    if (!this.isConfigured()) {
      console.warn('[Sailup Mock] SAILUP_API_KEY missing. Simulating SMS send.');
      return {
        id: `mock-sms-${Date.now()}`,
        to: recipientList,
        sender,
        body,
        quantity: recipientList.length,
        status: 'queued',
        delivery_status: '',
        created_at: new Date().toISOString(),
        isMock: true
      };
    }

    return await request('/sms/', {
      method: 'POST',
      body: JSON.stringify({
        from: sender,
        to: recipientList,
        body
      })
    });
  },

  /**
   * List sent SMS messages with pagination
   * @param {Object} [params]
   * @param {number} [params.limit=20]
   * @param {number} [params.offset=0]
   */
  async listSMS({ limit = 20, offset = 0 } = {}) {
    if (!this.isConfigured()) {
      return { count: 0, next: null, previous: null, results: [], isMock: true };
    }
    return await request(`/sms/?limit=${limit}&offset=${offset}`, {
      method: 'GET'
    });
  },

  /**
   * Get delivery status of a single message by ID
   * @param {string} messageId UUID of message
   */
  async getSMS(messageId) {
    if (!this.isConfigured()) {
      return {
        id: messageId,
        to: ['+233201234567'],
        sender: getDefaultSender(),
        body: 'Simulated message',
        quantity: 1,
        status: 'dispatched',
        delivery_status: '',
        created_at: new Date().toISOString(),
        isMock: true
      };
    }
    return await request(`/sms/${messageId}/`, {
      method: 'GET'
    });
  },

  // ==========================================
  // CONTACTS ENDPOINTS
  // ==========================================

  /**
   * List contacts with optional search & filter
   * @param {Object} [params]
   * @param {string} [params.search] Search by phone or name
   * @param {boolean} [params.opted_in] Filter by opt-in status
   * @param {number} [params.limit=20]
   * @param {number} [params.offset=0]
   */
  async listContacts({ search, opted_in, limit = 20, offset = 0 } = {}) {
    if (!this.isConfigured()) {
      return { count: 0, next: null, previous: null, results: [], isMock: true };
    }

    const query = new URLSearchParams();
    query.set('limit', limit.toString());
    query.set('offset', offset.toString());
    if (search) query.set('search', search);
    if (typeof opted_in === 'boolean') query.set('opted_in', opted_in.toString());

    return await request(`/contacts/?${query.toString()}`, {
      method: 'GET'
    });
  },

  /**
   * Create a new contact
   * @param {Object} contactData
   * @param {string} contactData.phone E.164 phone number
   * @param {string} [contactData.first_name]
   * @param {string} [contactData.last_name]
   * @param {Object} [contactData.attributes] Custom key-value pairs
   * @param {boolean} [contactData.opted_in]
   * @param {string} [contactData.opt_in_source] "API", "CSV", or "MANUAL"
   * @param {string[]} [contactData.list_ids] Array of list IDs (max 10)
   */
  async createContact(contactData) {
    if (!this.isConfigured()) {
      return {
        id: `mock-contact-${Date.now()}`,
        phone: contactData.phone,
        first_name: contactData.first_name || '',
        last_name: contactData.last_name || '',
        attributes: contactData.attributes || {},
        opted_in: contactData.opted_in ?? true,
        opt_in_source: contactData.opt_in_source || 'API',
        opted_out_at: null,
        created_at: new Date().toISOString(),
        isMock: true
      };
    }

    return await request('/contacts/', {
      method: 'POST',
      body: JSON.stringify(contactData)
    });
  },

  /**
   * Get single contact by UUID
   * @param {string} contactId
   */
  async getContact(contactId) {
    if (!this.isConfigured()) {
      return {
        id: contactId,
        phone: '+233201234567',
        first_name: 'Mock',
        last_name: 'User',
        attributes: {},
        opted_in: true,
        opt_in_source: 'MANUAL',
        created_at: new Date().toISOString(),
        lists: [],
        isMock: true
      };
    }
    return await request(`/contacts/${contactId}/`, {
      method: 'GET'
    });
  },

  /**
   * Partially update contact details
   * @param {string} contactId
   * @param {Object} updates { first_name, last_name, attributes, opted_in }
   */
  async updateContact(contactId, updates) {
    if (!this.isConfigured()) {
      return { id: contactId, ...updates, isMock: true };
    }
    return await request(`/contacts/${contactId}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  /**
   * Soft-delete a contact
   * @param {string} contactId
   */
  async deleteContact(contactId) {
    if (!this.isConfigured()) {
      return { success: true, isMock: true };
    }
    return await request(`/contacts/${contactId}/`, {
      method: 'DELETE'
    });
  },

  /**
   * Bulk upsert contacts (up to 500)
   * @param {Object[]} contacts Array of contact objects
   */
  async bulkUpsertContacts(contacts) {
    if (!this.isConfigured()) {
      return { imported: contacts.length, skipped: 0, failed: 0, errors: [], isMock: true };
    }

    return await request('/contacts/bulk/', {
      method: 'POST',
      body: JSON.stringify({ contacts })
    });
  },

  // ==========================================
  // LISTS ENDPOINTS
  // ==========================================

  /**
   * List contact lists
   * @param {Object} [params]
   * @param {number} [params.limit=20]
   * @param {number} [params.offset=0]
   */
  async listLists({ limit = 20, offset = 0 } = {}) {
    if (!this.isConfigured()) {
      return { count: 0, next: null, previous: null, results: [], isMock: true };
    }
    return await request(`/lists/?limit=${limit}&offset=${offset}`, {
      method: 'GET'
    });
  },

  /**
   * Create a new contact list
   * @param {Object} listData
   * @param {string} listData.name
   * @param {string} [listData.description]
   */
  async createList({ name, description = '' }) {
    if (!this.isConfigured()) {
      return {
        id: `mock-list-${Date.now()}`,
        name,
        description,
        contact_count: 0,
        created_at: new Date().toISOString(),
        isMock: true
      };
    }
    return await request('/lists/', {
      method: 'POST',
      body: JSON.stringify({ name, description })
    });
  },

  /**
   * Get single contact list by ID
   * @param {string} listId
   */
  async getList(listId) {
    if (!this.isConfigured()) {
      return {
        id: listId,
        name: 'Mock List',
        description: 'Sample List',
        contact_count: 0,
        created_at: new Date().toISOString(),
        isMock: true
      };
    }
    return await request(`/lists/${listId}/`, {
      method: 'GET'
    });
  },

  /**
   * Update contact list name or description
   * @param {string} listId
   * @param {Object} updates { name, description }
   */
  async updateList(listId, updates) {
    if (!this.isConfigured()) {
      return { id: listId, ...updates, isMock: true };
    }
    return await request(`/lists/${listId}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  /**
   * Soft-delete contact list
   * @param {string} listId
   */
  async deleteList(listId) {
    if (!this.isConfigured()) {
      return { success: true, isMock: true };
    }
    return await request(`/lists/${listId}/`, {
      method: 'DELETE'
    });
  },

  /**
   * List contacts within a specific list
   * @param {string} listId
   * @param {Object} [params]
   * @param {number} [params.limit=20]
   * @param {number} [params.offset=0]
   */
  async listListContacts(listId, { limit = 20, offset = 0 } = {}) {
    if (!this.isConfigured()) {
      return { count: 0, next: null, previous: null, results: [], isMock: true };
    }
    return await request(`/lists/${listId}/contacts/?limit=${limit}&offset=${offset}`, {
      method: 'GET'
    });
  },

  /**
   * Add contacts to a list (max 500 contact IDs)
   * @param {string} listId
   * @param {string[]} contactIds Array of contact UUIDs
   */
  async addContactsToList(listId, contactIds) {
    if (!this.isConfigured()) {
      return { added: contactIds.length, already_in_list: 0, not_found: 0, isMock: true };
    }
    return await request(`/lists/${listId}/contacts/`, {
      method: 'POST',
      body: JSON.stringify({ contact_ids: contactIds })
    });
  },

  /**
   * Remove single contact from a list
   * @param {string} listId
   * @param {string} contactId
   */
  async removeContactFromList(listId, contactId) {
    if (!this.isConfigured()) {
      return { success: true, isMock: true };
    }
    return await request(`/lists/${listId}/contacts/${contactId}/`, {
      method: 'DELETE'
    });
  }
};
