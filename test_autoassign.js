const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const people = db.people;
const schedules = db.schedules.map(s => ({ ...s }));

const getAvailablePerson = (role, date, excludeIds, service = null) => {
  const available = people.filter(p => {
    if (!p.roles.includes(role)) return false;
    if (p.excludeDates && p.excludeDates.includes(date)) return false;
    if (excludeIds.includes(p.id)) return false;
    if (p.roles.includes('第一堂工作人員') && service === 'service2') return false;
    if (p.roles.includes('第二堂工作人員') && service === 'service1') return false;
    return true;
  });
  if (available.length === 0) return null;
  // choose deterministically for test
  return available[0];
};

const autoAssign = () => {
  return schedules.map(schedule => {
    const chen = people.find(p => p.name === '陳俊亨');
    const guo = people.find(p => p.name === '郭嘉玲');
    const chenId = chen && String(chen.id);
    const guoId = guo && String(guo.id);

    const isPersonAvailableForRole = (person, role, date, excludeIds) => {
      if (!person) return false;
      if (!person.roles.includes(role)) return false;
      if (person.excludeDates && person.excludeDates.includes(date)) return false;
      if ((excludeIds || []).map(id => String(id)).includes(String(person.id))) return false;
      return true;
    };

    if (schedule.isJoint) {
      if (
        chen && guo &&
        isPersonAvailableForRole(chen, '音控手', schedule.date, []) &&
        isPersonAvailableForRole(guo, '投影手', schedule.date, [])
      ) {
        return {
          ...schedule,
          assignments: {
            service1: { projector: guoId, sound: chenId },
            service2: { projector: null, sound: null }
          }
        };
      }

      const projector = getAvailablePerson('投影手', schedule.date, [], 'service1');
      const sound = getAvailablePerson('音控手', schedule.date, [projector?.id], 'service1');
      return {
        ...schedule,
        assignments: {
          service1: { projector: projector?.id || null, sound: sound?.id || null },
          service2: { projector: null, sound: null }
        }
      };
    } else {
      if (
        chen && guo &&
        isPersonAvailableForRole(chen, '音控手', schedule.date, []) &&
        isPersonAvailableForRole(guo, '投影手', schedule.date, [])
      ) {
        const proj2 = getAvailablePerson('投影手', schedule.date, [guoId, chenId], 'service2');
        const sound2 = getAvailablePerson('音控手', schedule.date, [guoId, chenId, proj2?.id], 'service2');
        return {
          ...schedule,
          assignments: {
            service1: { projector: guoId, sound: chenId },
            service2: { projector: proj2?.id || null, sound: sound2?.id || null }
          }
        };
      }

      const proj1 = getAvailablePerson('投影手', schedule.date, [], 'service1');
      const sound1 = getAvailablePerson('音控手', schedule.date, [proj1?.id], 'service1');
      const proj2 = getAvailablePerson('投影手', schedule.date, [proj1?.id, sound1?.id], 'service2');
      const sound2 = getAvailablePerson('音控手', schedule.date, [proj1?.id, sound1?.id, proj2?.id], 'service2');
      return {
        ...schedule,
        assignments: {
          service1: { projector: proj1?.id || null, sound: sound1?.id || null },
          service2: { projector: proj2?.id || null, sound: sound2?.id || null }
        }
      };
    }
  });
};

const assigned = autoAssign();

const idToPerson = id => people.find(p => p.id === id) || null;

let violations = 0;
assigned.forEach(s => {
  console.log('Date:', s.date, 'isJoint:', s.isJoint);
  ['service1', 'service2'].forEach(service => {
    const assign = s.assignments[service];
    ['projector', 'sound'].forEach(role => {
      const pid = assign[role];
      const person = idToPerson(pid);
      if (person) {
        console.log(`  ${service} ${role}: ${person.name} (roles: ${person.roles.join(',')})`);
        if (service === 'service1' && person.roles.includes('第二堂工作人員')) {
          console.log('    >> VIOLATION: has 第二堂工作人員 but assigned to service1');
          violations++;
        }
        if (service === 'service2' && person.roles.includes('第一堂工作人員')) {
          console.log('    >> VIOLATION: has 第一堂工作人員 but assigned to service2');
          violations++;
        }
      } else {
        console.log(`  ${service} ${role}: -`);
      }
    });
  });
  console.log('');
});

console.log('Total violations:', violations);
if (violations === 0) {
  console.log('Service-specific assignment rules respected.');
} else {
  console.log('Found violations.');
}

process.exit(0);
