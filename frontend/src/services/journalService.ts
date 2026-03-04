import { Journal, JournalPrompt, JournalTemplate, MoodOption, JournalStats, JournalFilters } from '../types/journal';

const API_URL = '/api/journals';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
});

// Fetch all journals with filters
export const fetchJournals = async (filters: JournalFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.mood) params.append('mood', filters.mood);
  if (filters.search) params.append('search', filters.search);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  const response = await fetch(`${API_URL}?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

// Fetch single journal by ID
export const fetchJournalById = async (id: number) => {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

// Create new journal
export const createJournal = async (data: Partial<Journal>) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return response.json();
};

// Update journal
export const updateJournal = async (id: number, data: Partial<Journal>) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  return response.json();
};

// Delete journal
export const deleteJournal = async (id: number) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  return response.json();
};

// Fetch journal statistics
export const fetchJournalStats = async (): Promise<{ success: boolean; data: JournalStats }> => {
  const response = await fetch(`${API_URL}/stats`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

// Fetch prompts
export const fetchPrompts = async (): Promise<{ success: boolean; data: { prompts: JournalPrompt[] } }> => {
  const response = await fetch(`${API_URL}/prompts`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

// Fetch templates
export const fetchTemplates = async (): Promise<{ success: boolean; data: JournalTemplate[] }> => {
  const response = await fetch(`${API_URL}/templates`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

// Fetch mood options
export const fetchMoods = async (): Promise<{ success: boolean; data: MoodOption[] }> => {
  const response = await fetch(`${API_URL}/moods`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

// Export single journal as PDF data
export const exportJournalPdf = async (id: number) => {
  const response = await fetch(`${API_URL}/export/${id}`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

// Export all journals as PDF data
export const exportAllJournals = async () => {
  const response = await fetch(`${API_URL}/export/all/data`, {
    headers: getAuthHeaders()
  });
  return response.json();
};

// Generate PDF for single journal (client-side)
export const generatePdf = (journal: Journal) => {
  const content = `
<!DOCTYPE html>
<html>
<head>
  <title>${journal.title || 'Journal Entry'} - Collective Souls</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { color: #6B46C1; border-bottom: 2px solid #6B46C1; padding-bottom: 10px; }
    .meta { color: #666; margin-bottom: 20px; }
    .content { line-height: 1.8; white-space: pre-wrap; }
    .tags { margin-top: 20px; }
    .tag { background: #E9D8FD; color: #6B46C1; padding: 4px 12px; border-radius: 20px; margin-right: 8px; }
  </style>
</head>
<body>
  <h1>${journal.title || 'Untitled Entry'}</h1>
  <div class="meta">
    <p>Date: ${new Date(journal.entry_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    ${journal.mood ? `<p>Mood: ${journal.mood}</p>` : ''}
    <p>Words: ${journal.word_count}</p>
  </div>
  <div class="content">${journal.content}</div>
  ${journal.tags_array && journal.tags_array.length > 0 ? `
    <div class="tags">
      ${journal.tags_array.map(tag => `<span class="tag">#${tag}</span>`).join('')}
    </div>
  ` : ''}
</body>
</html>
  `;
  
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `journal-${journal.entry_date}.html`;
  a.click();
  URL.revokeObjectURL(url);
};

// Generate PDF for all journals (client-side)
export const generateAllJournalsPdf = (journals: Journal[]) => {
  const content = `
<!DOCTYPE html>
<html>
<head>
  <title>My Spiritual Journal - Collective Souls</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1 { color: #6B46C1; text-align: center; border-bottom: 2px solid #6B46C1; padding-bottom: 20px; }
    .entry { margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #E2E8F0; }
    .entry:last-child { border-bottom: none; }
    h2 { color: #6B46C1; }
    .meta { color: #666; margin-bottom: 10px; font-size: 14px; }
    .content { line-height: 1.8; white-space: pre-wrap; }
    .tags { margin-top: 10px; }
    .tag { background: #E9D8FD; color: #6B46C1; padding: 2px 8px; border-radius: 10px; margin-right: 4px; font-size: 12px; }
  </style>
</head>
<body>
  <h1>📔 My Spiritual Journal</h1>
  <p style="text-align: center; color: #666;">${journals.length} entries exported from Collective Souls</p>
  
  ${journals.map(journal => `
    <div class="entry">
      <h2>${journal.title || 'Untitled Entry'}</h2>
      <div class="meta">
        ${new Date(journal.entry_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        ${journal.mood ? ` • ${journal.mood}` : ''}
        • ${journal.word_count} words
      </div>
      <div class="content">${journal.content}</div>
      ${journal.tags_array && journal.tags_array.length > 0 ? `
        <div class="tags">
          ${journal.tags_array.map(tag => `<span class="tag">#${tag}</span>`).join('')}
        </div>
      ` : ''}
    </div>
  `).join('')}
</body>
</html>
  `;
  
  const blob = new Blob([content], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `all-journals-${new Date().toISOString().split('T')[0]}.html`;
  a.click();
  URL.revokeObjectURL(url);
};