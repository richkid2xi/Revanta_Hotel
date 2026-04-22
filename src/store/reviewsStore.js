export const generateMockReviews = () => {
  const reviews = [];
  const statuses = [
    ...Array(7).fill('unread'),
    ...Array(6).fill('read'),
    ...Array(21).fill('resolved')
  ];
  
  const comments = [
    "Service was decent but the waiting time could be improved significantly.",
    "Excellent experience. The officer was very professional and the waiting time was minimal.",
    "The permit process took far longer than expected. Staff were not forthcoming with updates.",
    "Quick and easy process. The staff were helpful and professional.",
    "Not very satisfied with the handling of my case. The environment was noisy.",
    "Great work by the team. Very efficient in processing my application.",
    "I had to wait in line for hours. Need better management and queue system.",
    "Very friendly staff and clean facilities. Overall a positive experience.",
    "Could not get the precise information I needed. Quite frustrating.",
    "Overall a smooth process. Thanks for the swift support."
  ];

  const authors = [
    null,
    { name: "Kwame Asante", email: "kwame.asante@gmail.com", phone: "+233 24 456 7890" },
    { name: "Osei Kwabena", email: "okwabena@gmail.com", phone: "+233 55 123 4567" },
    null,
    { name: "Abena Mensah", email: "abena.m@yahoo.com", phone: "+233 20 987 6543" },
    { name: "Kofi Boateng", email: "kofi.b@hotmail.com", phone: "+233 24 111 2222" },
    null,
    { name: "Akua Danso", email: "akua.d@gmail.com", phone: "+233 50 333 4444" }
  ];

  const baseDate = new Date('2024-04-22T12:00:00Z');

  for (let i = 0; i < 34; i++) {
    const rawDate = new Date(baseDate.getTime() - i * 3600000 * 4.5 - Math.random() * 3600000);
    
    const day = rawDate.getDate().toString().padStart(2, '0');
    const month = rawDate.toLocaleString('default', { month: 'long' });
    const year = rawDate.getFullYear();
    const hours = rawDate.getHours().toString().padStart(2, '0');
    const minutes = rawDate.getMinutes().toString().padStart(2, '0');
    const dayName = rawDate.toLocaleString('default', { weekday: 'long' });
    const dateStr = `${dayName}, ${day} ${month} ${year} at ${hours}:${minutes}`;
    const shortDateStr = `${day} ${month.slice(0,3)} ${year}, ${hours}:${minutes}`;

    const isAnon = i % 3 === 0;
    const rating = Math.floor(Math.random() * 5) + 1;
    
    // resolved Date
    let resolvedDateStr = null;
    let rawResolvedDate = null;
    if (statuses[i] === 'resolved') {
      const rDate = new Date(rawDate.getTime() + Math.random() * 86400000 * 2); // 0-2 days later
      rawResolvedDate = rDate.getTime();
      const rDay = rDate.getDate().toString().padStart(2, '0');
      const rMonth = rDate.toLocaleString('default', { month: 'short' });
      resolvedDateStr = `${rDay} ${rMonth} ${rDate.getFullYear()}`;
    }

    reviews.push({
      id: `REF-2024-${(34 - i).toString().padStart(3, '0')}`,
      rawDate: rawDate.getTime(),
      date: dateStr,
      shortDate: shortDateStr,
      rating: rating,
      status: statuses[i],
      isAnonymous: isAnon,
      text: comments[i % comments.length],
      author: isAnon ? null : authors[i % authors.length],
      questions: [
        { label: 'Q1 · OVERALL SATISFACTION', text: 'Overall, how satisfied are you with your visit today?', score: rating, icon: 'sentiment_satisfied' },
        { label: 'Q2 · STAFF ATTITUDE & PROFESSIONALISM', text: 'How would you rate the attitude and professionalism of the staff you interacted with?', score: Math.min(5, rating + 1), icon: 'groups' },
        { label: 'Q3 · WAITING TIME', text: 'How long did you wait before you were attended to?', score: Math.max(1, rating - 1), icon: 'schedule' },
        { label: 'Q4 · PROGRESS ON VISIT PURPOSE', text: 'Were you able to resolve or make progress on the reason you came today?', score: rating, icon: 'check_circle_outline' },
        { label: 'Q5 · OFFICE CLEANLINESS & COMFORT', text: 'How would you rate the cleanliness and comfort of the office environment?', score: Math.min(5, rating + 1), icon: 'business' }
      ],
      purpose: i % 2 === 0 ? "Trade license application" : "General Inquiry",
      notes: "",
      rawResolvedDate,
      resolvedDateStr
    });
  }
  return reviews;
};

export const getReviews = () => {
  const stored = localStorage.getItem('revanta_reviews');
  if (stored) {
    return JSON.parse(stored);
  }
  const initial = generateMockReviews();
  localStorage.setItem('revanta_reviews', JSON.stringify(initial));
  return initial;
};

export const updateReview = (id, updates) => {
  const reviews = getReviews();
  const index = reviews.findIndex(r => r.id === id);
  if (index !== -1) {
    reviews[index] = { ...reviews[index], ...updates };
    localStorage.setItem('revanta_reviews', JSON.stringify(reviews));
  }
  return reviews;
};

export const addReview = (reviewData) => {
  const reviews = getReviews();
  const nextNum = reviews.length + 1;
  const now = new Date();
  const year = now.getFullYear();
  const review = {
    ...reviewData,
    id: reviewData.id || `REF-${year}-${nextNum.toString().padStart(3, '0')}`,
  };
  reviews.unshift(review); // newest first
  localStorage.setItem('revanta_reviews', JSON.stringify(reviews));
  return review;
};

