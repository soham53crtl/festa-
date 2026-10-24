'use strict';
/** Static event data: budget splits, vendors, milestones and idea pools per event type. */
const CURRENCY_SCALE = { INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0095 };

const TYPES = {
  wedding: {
    label: 'Wedding', leadDays: 150, minPerGuestINR: 2500,
    split: { 'Venue': 0.28, 'Catering': 0.30, 'Decor & flowers': 0.10, 'Photo & video': 0.10, 'Attire & beauty': 0.08, 'Music & entertainment': 0.06, 'Contingency': 0.08 },
    vendors: ['Venue', 'Caterer', 'Photographer & videographer', 'Decorator / florist', 'Makeup & hair', 'DJ or live band', 'Priest / officiant', 'Invitations & printing', 'Transport & stay for guests'],
    milestones: [[24, 'Fix budget, guest list and date'], [20, 'Book venue'], [16, 'Book photographer and caterer'], [12, 'Send save-the-dates; shop for attire'], [8, 'Finalise menu, decor and music'], [4, 'Send invitations; confirm RSVPs'], [2, 'Final headcount to vendors; seating plan'], [1, 'Vendor confirmation calls; pay balances'], [0, 'Event day: assign one point-person for vendors']],
    ideas: ['Mehendi or haldi brunch to spread guests across two days', 'Shared digital album so guests upload photos live', 'Regional-cuisine live counters instead of a fixed buffet', 'Handwritten notes at each seat for close family']
  },
  birthday: {
    label: 'Birthday', leadDays: 35, minPerGuestINR: 600,
    split: { 'Venue': 0.20, 'Food & cake': 0.38, 'Decor & balloons': 0.12, 'Entertainment & games': 0.15, 'Photography': 0.05, 'Return gifts': 0.05, 'Contingency': 0.05 },
    vendors: ['Venue or home setup', 'Caterer or restaurant', 'Cake baker', 'Decorator', 'Entertainer / host', 'Photographer', 'Return gifts supplier'],
    milestones: [[5, 'Set budget, guest list and theme'], [4, 'Book venue and cake'], [3, 'Send invites; order decor'], [2, 'Plan games and playlist'], [1, 'Confirm RSVPs and food count'], [0, 'Event day: set up 2 hours early']],
    ideas: ['Scavenger hunt built around the guest of honour\'s favourite things', 'Memory wall with printed photos from each year', 'DIY food stations (pizza, chaat or sundae bar)', 'Surprise video messages from far-away friends']
  },
  community: {
    label: 'Community event', leadDays: 60, minPerGuestINR: 250,
    split: { 'Venue & permissions': 0.20, 'Food & refreshments': 0.28, 'Sound, stage & lighting': 0.15, 'Publicity & printing': 0.10, 'Volunteers & logistics': 0.10, 'Safety & first aid': 0.05, 'Activities & prizes': 0.07, 'Contingency': 0.05 },
    vendors: ['Venue / ground permission', 'Local authority or society permit', 'Sound & lighting', 'Caterer or snack vendors', 'Printing & banners', 'First-aid / safety support', 'Volunteer coordinators'],
    milestones: [[8, 'Define goal, budget and core team'], [6, 'Secure venue and permits'], [5, 'Approach sponsors and local partners'], [4, 'Open volunteer sign-ups; start publicity'], [2, 'Finalise schedule, sound and food'], [1, 'Brief volunteers; run safety check'], [0, 'Event day: registration desk and feedback form ready']],
    ideas: ['Neighbourhood potluck where each lane brings one dish', 'Skill-swap stalls (repair, art, tutoring)', 'Local-business sponsor wall in return for in-kind support', 'Zero-waste setup with steel plates and a collection point']
  }
};

module.exports = { CURRENCY_SCALE, TYPES };
