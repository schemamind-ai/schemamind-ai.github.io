// Names are written exactly as in the project proposal (surname in capitals).
// Do not add photos, contact details, student numbers or titles that the
// proposal does not contain. Never apply CSS text-transform to these strings:
// with lang="en", browsers upper-case "i" to "I" instead of "İ".

export interface Person {
  name: string;
  department?: string;
}

export const students: Person[] = [
  { name: 'Namık Batın GAMBAZ', department: 'Software Engineering' },
  { name: 'Ömer Buğra KESKİN', department: 'Software Engineering' },
  { name: 'Berke MERT', department: 'Software Engineering' },
];

export const supervisor: Person = { name: 'Tansel DÖKEROĞLU' };

export const jury: Person[] = [{ name: 'Kasım Murat KARAKAYA' }, { name: 'Deniz CANTÜRK' }];
