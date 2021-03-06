let values = require('./values.js');
let elements = require('./elements.js');
let heroes = require('../data/hero-access.js');
let skills = require('../data/skill-access.js');
let blessings = require('../data/blessing-access.js');
let utils = require('./utils.js');
let inheritPlanner = require('./inheritance-planner.js');
let canvas;

let fehUnit = {
  data : {
    assets: { main: values.CONST.IMAGE_FEH },
    name: "Feh", title: "Sleepy Owl",
    stats: {
      level1: { hp: 8, atk: 8, spd: 8, def: 8, res: 8 },
      level40: { hp: [147,150,153], atk: [0,3,6], spd: [0,3,6], def: [0,3,6], res: [0,3,6] }
    },
    moveType: "Flying", colorType: "Neutral", weaponType: "Staff"
  },
  iv: {boon: '-', bane: '-'},
  merges: 0, support: false,
  stats : { hp: 40, atk: 40, spd: 40, def: 40, res: 40 },
  skills: {
    weapon: values.CONST.EMPTY_SKILL,
    refine: values.CONST.EMPTY_SKILL,
    assist: values.CONST.EMPTY_SKILL,
    special: values.CONST.EMPTY_SKILL,
    skillA: values.CONST.EMPTY_SKILL,
    skillB: values.CONST.EMPTY_SKILL,
    skillC: values.CONST.EMPTY_SKILL,
    seal: values.CONST.EMPTY_SKILL
  },
  rarity: 5,
  buffs: { atk: 0, spd: 0, def: 0, res: 0 },
  tempestBuff: false,
  legendary: false,
  blessing: '-',
  blessingIcon: -1,
  allies: []
};

function init(canvasObj) {
  $(elements.SELECT_HERO).selectable({data: heroes.getAllHeroes()});
  $(elements.SELECT_RARITY).selectable({
    optionGenerator: rarityOptGenerator,
    search: false,
    disabled: 'disabled',
    text: '5★',
    value: 5
  });
  $(elements.SELECT_IV).selectable({
    data: values.CONST.IV,
    optionGenerator: ivOptGenerator,
    onSelect: ivSelectableDisplay,
    search: false,
    header: '<div class="dropdown-header"><span class="opt-half">Boon</span><span class="opt-half">Bane</span></div>'
  });
  $(elements.SELECT_MERGES).selectable({
    data: values.CONST.MERGES,
    optionGenerator: utils.arrOptGenerator,
    search: false
  });
  $(elements.SELECT_BUFFS).selectable({
    data: values.CONST.BUFFS,
    optionGenerator: utils.arrOptGenerator,
    search: false,
    text: 0,
    value: 0
  });
  $(elements.SELECT_BLESSING_TYPE).selectable({
    data: blessings.getBlessingTypes(),
    optionGenerator: utils.arrOptGenerator,
    search: false
  });
  $(elements.SELECT_BLESSING_HERO).selectable({
    optionGenerator: utils.arrOptGenerator,
    disabled: 'disabled',
    search: false
  });

  $(elements.SELECT_WEAPON).selectable({disabled: 'disabled'});
  $(elements.SELECT_REFINE).selectable({disabled: 'disabled'});
  $(elements.SELECT_ASSIST).selectable({disabled: 'disabled'});
  $(elements.SELECT_SPECIAL).selectable({disabled: 'disabled'});
  $(elements.SELECT_SKILLA).selectable({disabled: 'disabled'});
  $(elements.SELECT_SKILLB).selectable({disabled: 'disabled'});
  $(elements.SELECT_SKILLC).selectable({disabled: 'disabled'});
  $(elements.SELECT_SEAL).selectable({disabled: 'disabled'});

  canvas = canvasObj;
  bindEvents();
}

function bindEvents() {
  $(elements.SELECT_HERO).on('select', onHeroSelect);
  $(elements.SELECT_RARITY).on('select', onRaritySelect);
  $(elements.SELECT_IV).on('select', onIvSelect);
  $(elements.SELECT_MERGES).on('select', onMergeSelect);
  $(elements.SELECT_SKILL).on('select', onSkillSelect);

  $(elements.SELECT_BUFFS).on('select', onBuffSelect);
  $(elements.SELECT_IV_SHOW).on('change', onShowIvChange);
  $(elements.SELECT_SUPPORT).on('change', onSupportChange);
  $(elements.SELECT_TT).on('change', onTempestBuffChange);
  $(elements.SELECT_BLESSING_TYPE).on('select', onBlessingTypeChange);
  $(elements.SELECT_BLESSING_HERO).on('select', onBlessingAllyChange);

  $(elements.INHERIT_MODAL).on('shown.bs.modal', onInheritanceShow);
}


function onHeroSelect(event) {
  let hero = $(event.currentTarget).data('val');
  let highlightList = hero.skills.map(skill => skill.name);

  $(document).trigger('hero-select', [hero.name, hero.weaponType]);
  fehUnit.data = hero;
  for (let skill in fehUnit.skills) {
    fehUnit.skills[skill] = values.CONST.EMPTY_SKILL;
  }
  fehUnit.rarity = 5;

  fehUnit.legendary = blessings.isLegendaryHero(hero.name);
  if (fehUnit.legendary) {
    let blessing = blessings.getBlessing(hero.name);
    fehUnit.blessing = blessing.type;
    fehUnit.blessingIcon = blessing.icon;
    $(elements.SELECT_BLESSING_TYPE)
        .selectable('reset')
        .selectable('disable');
    $(elements.SELECT_BLESSING_HERO)
        .selectable('reset')
        .selectable('disable');
  } else {
    fehUnit.blessing = '-';
    $(elements.SELECT_BLESSING_TYPE)
        .selectable('text', '-')
        .selectable('enable');
  }
  drawHero(fehUnit);

  $(elements.SELECT_WEAPON)
      .selectable('highlight', highlightList)
      .selectable('data', [values.CONST.EMPTY_SKILL].concat(skills.getWeapons(hero)));
  $(elements.SELECT_ASSIST)
      .selectable('highlight', highlightList)
      .selectable('data', [values.CONST.EMPTY_SKILL].concat(skills.getAssists(hero)));
  $(elements.SELECT_SPECIAL)
      .selectable('highlight', highlightList)
      .selectable('data', [values.CONST.EMPTY_SKILL].concat(skills.getSpecials(hero)));
  $(elements.SELECT_SKILLA)
      .selectable('highlight', highlightList)
      .selectable('data', [values.CONST.EMPTY_SKILL].concat(skills.getSkillA(hero)));
  $(elements.SELECT_SKILLB)
      .selectable('highlight', highlightList)
      .selectable('data', [values.CONST.EMPTY_SKILL].concat(skills.getSkillB(hero)));
  $(elements.SELECT_SKILLC)
      .selectable('highlight', highlightList)
      .selectable('data', [values.CONST.EMPTY_SKILL].concat(skills.getSkillC(hero)));
  $(elements.SELECT_SEAL)
      .selectable('data', [values.CONST.EMPTY_SKILL].concat(skills.getSeals(hero)));

  $(elements.SELECT_REFINE).selectable('clear').selectable('disable');
  $(elements.SELECT_IV).selectable('enable');
  $(elements.SKILL_INFO).empty();
  $(elements.SKILL_INFO_ICON).addClass('d-none');

  if (hero.rarity4) {
    $(elements.SELECT_RARITY)
        .selectable('data', values.CONST.RARITIES)
        .selectable('enable');
  } else {
    $(elements.SELECT_RARITY)
        .selectable('data', values.CONST.RARITIES.slice(0, 1))
        .selectable('disable');
  }
}
function onSkillSelect(event) {
  let skillType = $(event.currentTarget).data('skill');
  let skill = $(event.currentTarget).data('val');

  if (skillType === 'weapon') {
    let refinery = skills.getRefinery(skill.name, fehUnit.data.name);
    if (refinery) {
      $(elements.SELECT_REFINE).selectable('data', [values.CONST.EMPTY_SKILL].concat(refinery));
    } else {
      $(elements.SELECT_REFINE).selectable('clear').selectable('disable');
    }
    fehUnit.skills.refine = values.CONST.EMPTY_SKILL;
    $('.skill-info-icon[data-skill="refine"]').addClass('d-none');
  }

  if (skillType !== 'seal') {
    toggleSkillInfo(skillType, skill);
  }
  fehUnit.skills[skillType] = skill;
  drawHero(fehUnit);
};
function onIvSelect(event) {
  fehUnit.iv = $(event.currentTarget).data('val');
  drawHero(fehUnit);
};
function onMergeSelect(event) {
  fehUnit.merges = $(event.currentTarget).data('val');
  drawHero(fehUnit);
};
function onRaritySelect(event) {
  fehUnit.rarity = parseInt($(event.currentTarget).data('val'));
  drawHero(fehUnit);
};
function onBuffSelect(event) {
  let $select = $(event.currentTarget);
  fehUnit.buffs[$select.data('stat')] = $select.data('val');
  drawHero(fehUnit);
};
function onSupportChange(event) {
  fehUnit.support = $(elements.SELECT_SUPPORT_ON).is(':checked');
  drawHero(fehUnit);
}
function onShowIvChange(event) {
  drawHero(fehUnit, false);
}
function onTempestBuffChange(event) {
  fehUnit.tempestBuff = $(elements.SELECT_TT_ON).is(':checked');
  drawHero(fehUnit);
}
function onInheritanceShow(event) {
  let previousData = $(elements.SHOW_INHERITANCE).data('skills');
  let targetSkills = [];
  for (let skill in fehUnit.skills) {
    if (skill !== 'seal' && skill !== 'refine' && fehUnit.skills[skill].name !== '-') {
      targetSkills.push(fehUnit.skills[skill]);
    }
  }

  if (isSkillSetChanged(targetSkills, previousData)) {
    inheritPlanner.getInheritancePlanPromise(targetSkills, fehUnit.data, fehUnit.rarity, 2)
        .then((e) => {
          $(elements.INHERIT_LIST).html(getInheritanceHtml(e));
        })
  }
}
function onBlessingTypeChange(event) {
  let blessing = $(event.currentTarget).data('val');
  if (fehUnit.blessing !== blessing) {
    fehUnit.blessing = blessing;
    fehUnit.allies = [];
    $(elements.SELECT_BLESSING_HERO)
        .selectable('reset')
        .selectable('data', blessings.getBlessingOptions(fehUnit.blessing))
        .selectable('enable');
    drawHero(fehUnit);
  }
}
function onBlessingAllyChange(event) {
  let allies = [];
  let allySelect = $(elements.SELECT_BLESSING_HERO);

  for (let i = 0; i < allySelect.length; i++) {
    let ally = $(allySelect[i]).data('val');
    if (ally && ally !== '-') {
      allies.push(ally);
    }
  }
  fehUnit.allies = allies;
  drawHero(fehUnit);
}

function drawHero(hero, processHero = true) {
  if (processHero) {
    processHeroStats(hero);
  }
  utils.loadFiles([hero.data.assets.main]).then(imgs => {
    canvas.drawHero(hero, imgs[0]);
  });
}


function processHeroStats(hero) {
  let stats40 = {};
  let stats1 = {};
  let baseStatsLevel1;
  let baseStatsLevel40;

  if (hero.rarity === 5) {
    baseStatsLevel1 = hero.data.stats.level1;
    baseStatsLevel40 = hero.data.stats.level40;
  } else {
    baseStatsLevel1 = hero.data.stats.level1_4;
    baseStatsLevel40 = hero.data.stats.level40_4;
  }

  for (let st in baseStatsLevel1) {
    if (st === hero.iv.boon) {
      stats1[st] = baseStatsLevel1[st] + 1;
      stats40[st] = baseStatsLevel40[st][2];
    } else if (st === hero.iv.bane) {
      stats1[st] = baseStatsLevel1[st] - 1;
      stats40[st] = baseStatsLevel40[st][0];
    } else {
      stats1[st] = baseStatsLevel1[st];
      stats40[st] = baseStatsLevel40[st][1];
    }
  }

  if (hero.merges > 0) {
    let mergeBoost = getMergeBoost(stats1, hero.merges);
    for (let st in mergeBoost) {
      stats40[st] += mergeBoost[st];
    }
  }

  for (let skill in hero.skills) {
    if (hero.skills[skill].damage) {
      stats40.atk += hero.skills[skill].damage;
    }
    for (stat in hero.skills[skill].stats) {
      stats40[stat] += hero.skills[skill].stats[stat];
    }
  }

  if (hero.buffs) {
    for (let stat in hero.buffs) {
      stats40[stat] += hero.buffs[stat];
    }
  }

  if (hero.tempestBuff) {
    for (let stat in values.CONST.BUFFS_TT) {
      stats40[stat] += values.CONST.BUFFS_TT[stat];
    }
  }

  if (hero.support) {
    stats40.hp += 5;
    stats40.atk += 2;
    stats40.spd += 2;
    stats40.def += 2;
    stats40.res += 2;
  }

  hero.allies.forEach(ally => {
    let blessing = blessings.getBlessing(ally);
    for (let stat in blessing.stats) {
      stats40[stat] += blessing.stats[stat];
    }
  });

  for (let stat in stats40) {
    stats40[stat] = Math.max(0, stats40[stat]);
  }
  hero.stats = stats40;
}
function getMergeBoost(baseStats, merges) {
  let statIncrease = { hp: 0, atk: 0, spd: 0, def: 0, res: 0 };
  let stats = ['hp', 'atk', 'spd', 'def', 'res'];
  stats.sort((s1, s2) => baseStats[s2] - baseStats[s1]);

  for (let i = 0; i < merges; i++) {
    statIncrease[stats[(2 * i) % 5]]++;
    statIncrease[stats[(2 * i + 1) % 5]]++;
  }

  return statIncrease;
};
function toggleSkillInfo(skillType, skill) {
  new Promise(() => {
    let inheritance = [];
    if (skillType !== 'refine' || skillType !== 'seal') {
      inheritance = heroes.getInheritanceList(skill.name);
    }
    inheritance.sort((a, b) => a.rarity - b.rarity);

    $(`.skill-info-icon[data-skill="${skillType}"]`)
      .toggleClass('d-none', skill.name === '-')
      .popover('dispose')
      .popover({
        trigger: 'hover click',
        title: skill.name,
        html: true,
        content: getSkillInfoHtml(skillType, skill, inheritance)
      });
  });
};
function getSkillInfoHtml(skillType, skill, inheritance) {
  let html = '';
  let inheritHtml = '';

  if (skill.name === '-') {
    return '';
  }

  if (skillType === 'refine') {
    if (skill.name === '-') {
      html += `<span>SP Cost: 0</span>`;
    } else {
      let cost = skills.getRefineryCost(skill.cost || 0);
      html += `<span>SP Cost: ${cost.spCost}</span>`;
      if (cost.arenaMedals) {
        html += `<span>Arena Medals: ${cost.arenaMedals}</span>`;
      }
      if (cost.refiningStones) {
        html += `<span>Refining Stones: ${cost.refiningStones}</span>`;
      }
      if (cost.divineDew) {
        html += `<span>Divine Dew: ${cost.divineDew}</span>`;
      }
    }
  } else if (skillType === 'special') {
    html += `<span>SP Cost: ${skill.spCost}</span><span>Cooldown: ${skill.cooldown}</span>`;
  } else if (skillType !== 'seal') {
    html += `<span>SP Cost: ${skill.spCost}</span>`;
  }
  if (inheritance.length) {
    inheritHtml = '<h6>Inheritance</h6><div class="inherit-list"><ul class="list-group">' +
        inheritance.map(inherit => `<li class="list-group-item inherit-item">
            <span>${inherit.name}</span><span>[${inherit.rarity}]</span></li>`)
        .join('') + '</div><ul>';
  }
  return (html ? `<p class="skill-cost">${html}</p>` : '') + `<p>${skill.effect}</p>` + inheritHtml;
};

function isSkillSetChanged(newSkill, oldSkill) {
  return true;
}
function getInheritanceListHtml(skills) {
  let inheritance = {};
  for (let skillType in skills) {
    let unitList = [];
    if ((skillType !== 'refine' || skillType !== 'seal') &&
        (skills[skillType].name.length && skills[skillType].name !== '-')) {
      unitList = heroes.getInheritanceList(skills[skillType].name);
    }
    unitList.sort((a, b) => a.rarity - b.rarity);

  }
}
function getInheritanceHtml(inheritList) {
  let html = '';
  for (let i = 0; i < inheritList.length; i++) {
    html += `<ul class="list-group col col-sm-6">`;
    for (let j = 0; j < inheritList[i].length; j++) {
      html += `<li class="list-group-item p-0 d-flex">
          <div style="width: 75px;">
            <img src="img/heroes-portrait/75px-Icon_Portrait_${inheritList[i][j].name}.png">
            <img class="inherit-rarity" src="img/assets/star-rarity-${inheritList[i][j].rarity}.png">
          </div>
          <div class="pl-2">
            <b>${inheritList[i][j].name}</b>
            <div>${inheritList[i][j].skills.join('<br>')}</div>
          </div>
        </li>`;
    }
    html += `</ul>`;
  }
  return html;
}

function ivSelectableDisplay($opt, $this) {
  let data = $opt.data('val');
  let boon = data.boon === '-' ? data.boon : '+' + data.boon;
  let bane = data.bane === '-' ? data.bane : '-' + data.bane;
  $this.find('.btn').html(`<span class="opt-half">${boon}</span><span class="opt-half">${bane}</span>`);
  $this.data('val', $opt.data('val'));
};
function ivOptGenerator(item, $parent) {
  $(`<div class="dropdown-item">
      <span class="opt-half">${item.boon}</span>
      <span class="opt-half">${item.bane}</span>
    </div>`)
      .data('val', item)
      .appendTo($parent);
}
function rarityOptGenerator(item, $parent) {
  $(`<div class="dropdown-item">${item.name}</div>`)
      .data('val', item.value)
      .appendTo($parent);
}


module.exports = {
  init: init,
  drawHero: drawHero,
  hero: fehUnit
};
