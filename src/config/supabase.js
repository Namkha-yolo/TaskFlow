// Local Storage mock - no backend needed
const STORAGE_KEYS = {
  USER: 'taskflow_user',
  COURSES: 'taskflow_courses',
  ASSIGNMENTS: 'taskflow_assignments',
  STUDY_SESSIONS: 'taskflow_study_sessions'
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const getUser = () => {
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
};

const setUser = (user) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
};

const getData = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const supabase = {
  auth: {
    getSession: async () => {
      const user = getUser();
      return { data: { session: user ? { user } : null } };
    },
    onAuthStateChange: (callback) => {
      const user = getUser();
      if (user) callback('SIGNED_IN', { user });
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signInWithPassword: async ({ email, password }) => {
      const users = getData('taskflow_users');
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        const { password: _, ...safeUser } = user;
        setUser(safeUser);
        return { data: { user: safeUser }, error: null };
      }
      return { data: null, error: { message: 'Invalid email or password' } };
    },
    signUp: async ({ email, password, options }) => {
      const users = getData('taskflow_users');
      if (users.find(u => u.email === email)) {
        return { data: null, error: { message: 'User already exists' } };
      }
      const newUser = {
        id: generateId(),
        email,
        password,
        name: options?.data?.name || email.split('@')[0],
        user_metadata: options?.data || {},
        created_at: new Date().toISOString()
      };
      users.push(newUser);
      setData('taskflow_users', users);
      const { password: _, ...safeUser } = newUser;
      setUser(safeUser);
      return { data: { user: safeUser }, error: null };
    },
    signOut: async () => {
      setUser(null);
      return { error: null };
    },
    signInWithOAuth: async () => ({ error: { message: 'OAuth not available in demo' } })
  },
  from: (table) => {
    const key = `taskflow_${table}`;
    let filters = [];
    let orderConfig = null;
    let limitCount = null;

    const applyFiltersAndJoins = (data) => {
      // Apply filters
      filters.forEach(f => {
        if (f.type === 'eq') data = data.filter(d => d[f.field] === f.value);
        if (f.type === 'gte') data = data.filter(d => new Date(d[f.field]) >= new Date(f.value));
      });

      // Join related data
      const courses = getData('taskflow_courses');
      const assignments = getData('taskflow_assignments');

      if (table === 'assignments') {
        data = data.map(a => ({
          ...a,
          courses: courses.find(c => c.id === a.course_id) || null
        }));
      }

      if (table === 'study_sessions') {
        data = data.map(s => ({
          ...s,
          courses: courses.find(c => c.id === s.course_id) || null,
          assignments: assignments.find(a => a.id === s.assignment_id) || null
        }));
      }

      // Sort
      if (orderConfig) {
        data.sort((a, b) => {
          const av = a[orderConfig.field], bv = b[orderConfig.field];
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return orderConfig.asc ? cmp : -cmp;
        });
      }

      // Limit
      if (limitCount) data = data.slice(0, limitCount);

      return data;
    };

    const chain = {
      select: () => chain,
      eq: (field, value) => { filters.push({ field, value, type: 'eq' }); return chain; },
      gte: (field, value) => { filters.push({ field, value, type: 'gte' }); return chain; },
      order: (field, opts) => { orderConfig = { field, asc: opts?.ascending ?? true }; return chain; },
      limit: (n) => { limitCount = n; return chain; },
      single: () => chain,
      insert: (record) => {
        const data = getData(key);
        const newRecord = { ...record, id: generateId(), created_at: new Date().toISOString() };
        data.push(newRecord);
        setData(key, data);
        return { data: newRecord, error: null, select: () => ({ single: () => ({ data: newRecord, error: null }) }) };
      },
      update: (updates) => {
        let updateFilters = [];
        const updateChain = {
          eq: (field, value) => {
            updateFilters.push({ field, value });
            return {
              eq: (field2, value2) => {
                updateFilters.push({ field: field2, value: value2 });
                const data = getData(key);
                const idx = data.findIndex(d => updateFilters.every(f => d[f.field] === f.value));
                if (idx !== -1) {
                  data[idx] = { ...data[idx], ...updates };
                  setData(key, data);
                  return { data: data[idx], error: null, select: () => ({ single: () => ({ data: data[idx], error: null }) }) };
                }
                return { data: null, error: { message: 'Not found' } };
              },
              then: (resolve) => {
                const data = getData(key);
                const idx = data.findIndex(d => updateFilters.every(f => d[f.field] === f.value));
                if (idx !== -1) {
                  data[idx] = { ...data[idx], ...updates };
                  setData(key, data);
                  resolve({ data: data[idx], error: null });
                } else {
                  resolve({ data: null, error: { message: 'Not found' } });
                }
              }
            };
          }
        };
        return updateChain;
      },
      delete: () => {
        let deleteFilters = [];
        const deleteChain = {
          eq: (field, value) => {
            deleteFilters.push({ field, value });
            return {
              eq: (field2, value2) => {
                deleteFilters.push({ field: field2, value: value2 });
                let data = getData(key);
                data = data.filter(d => !deleteFilters.every(f => d[f.field] === f.value));
                setData(key, data);
                return { error: null };
              },
              then: (resolve) => {
                let data = getData(key);
                data = data.filter(d => !deleteFilters.every(f => d[f.field] === f.value));
                setData(key, data);
                resolve({ error: null });
              }
            };
          }
        };
        return deleteChain;
      },
      then: (resolve) => {
        let data = getData(key);
        data = applyFiltersAndJoins(data);
        resolve({ data, error: null });
      }
    };
    return chain;
  }
};

export { STORAGE_KEYS, getData, setData, generateId };
