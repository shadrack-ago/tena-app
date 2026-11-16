-- Shops created before 2026-11-02 were seeded with ten sample customers. New
-- shops get two, marked "(demo)". Bring older shops in line: keep Amina and
-- Brian as the two marked demo customers and remove the other eight sample
-- customers (their chats, sales and follow-ups go with them via cascade).
-- Matches only the fixed sample phone numbers, so real customers are untouched.

update customers set name = 'Amina Wanjiku (demo)'
where phone = '0712456789' and name = 'Amina Wanjiku';

update customers set name = 'Brian Otieno (demo)'
where phone = '0723987123' and name = 'Brian Otieno';

delete from customers
where phone in (
  '0701122334', '0733567890', '0744111222', '0718887766',
  '0722001100', '0700777888', '0799111222', '0711002200'
)
and name in (
  'Faith Chebet', 'Joseph Kamau', 'Mercy Achieng', 'Hassan Ali',
  'Njeri Mwangi', 'David Kipchoge', 'Lucy Wambui', 'Samuel Omondi'
);
