export const LEVELS = [
  {
    // Fase 1 - preservada exatamente como estava
    title: '1. Setor de Arquivos',
    color: 0x18d7ff,
    enemies: ['virus', 'virus', 'trojan'],
    tip: 'Não abra arquivos de origem desconhecida.',
    upgrade: 'Plasma concentrado',
    layout: {
      ground: [[500, 680, 1000, 80], [1240, 680, 400, 80], [1800, 680, 600, 80], [2300, 680, 400, 80]],
      floating: [[350, 530, 180, 22], [760, 470, 200, 22], [1180, 535, 190, 22], [1580, 455, 200, 22], [2050, 525, 200, 22]],
      terminal: [1780, 600],
      item: [1180, 500],
      spawns: [[420, 450], [750, 580], [1080, 450]]
    }
  },
  {
    // Fase 2 - 3 buracos. Plataformas baixas (fáceis) predominam, com só 1 mais alta.
    title: '2. Rede de Mensagens',
    color: 0x8b5cf6,
    enemies: ['virus', 'trojan', 'spyware', 'virus', 'phishing', 'trojan'],
    tip: 'Desconfie de links suspeitos.',
    upgrade: 'Tiro carregado',
    layout: {
      ground: [[300, 680, 600, 80], [955, 680, 590, 80], [1630, 680, 640, 80], [2255, 680, 490, 80]],
      floating: [[200, 530, 150, 22], [500, 470, 150, 22], [900, 530, 150, 22], [1500, 470, 160, 22], [1850, 530, 160, 22], [2200, 470, 160, 22]],
      terminal: [2255, 600],
      item: [1500, 435],
      spawns: [[250, 450], [600, 560], [950, 450], [1300, 560], [1700, 450], [2100, 560]]
    }
  },
  {
    // Fase 3 - 4 buracos. Mistura de plataformas baixas, médias e uma alta (via escada).
    title: '3. Cofre de Credenciais',
    color: 0x22e39a,
    enemies: ['spyware', 'phishing', 'ransomware', 'trojan', 'spyware', 'virus', 'phishing'],
    tip: 'Use senhas fortes e autenticação em dois fatores.',
    upgrade: 'Plasma perfurante',
    layout: {
      ground: [[225, 680, 450, 80], [705, 680, 390, 80], [1155, 680, 390, 80], [1605, 680, 390, 80], [2180, 680, 640, 80]],
      floating: [[200, 530, 150, 22], [350, 470, 150, 22], [700, 530, 160, 22], [1150, 470, 150, 22], [1600, 530, 160, 22], [2100, 470, 170, 22]],
      terminal: [2180, 600],
      item: [1150, 435],
      spawns: [[200, 450], [550, 560], [850, 450], [1150, 560], [1500, 450], [1850, 560], [2200, 450]]
    }
  },
  {
    // Fase 4 - 5 buracos. Menos plataformas flutuantes (mais foco no chão picado).
    title: '4. Núcleo de Backup',
    color: 0xffb020,
    enemies: ['virus', 'ransomware', 'spyware', 'worm', 'worm', 'trojan', 'virus'],
    tip: 'Mantenha backups e programas atualizados.',
    upgrade: 'Disparo dividido',
    layout: {
      ground: [[190, 680, 380, 80], [600, 680, 320, 80], [980, 680, 320, 80], [1360, 680, 320, 80], [1740, 680, 320, 80], [2230, 680, 540, 80]],
      floating: [[250, 530, 150, 22], [900, 470, 150, 22], [1400, 530, 160, 22], [2100, 470, 170, 22]],
      terminal: [2230, 600],
      item: [900, 435],
      spawns: [[200, 450], [550, 560], [850, 450], [1150, 560], [1500, 450], [1850, 560], [2200, 450]]
    }
  },
  {
    // Fase 5 - 6 buracos (a mais picada). Bastante plataforma flutuante antes do boss.
    title: '5. Servidor Central',
    color: 0xff356b,
    enemies: ['virus', 'spyware', 'ransomware', 'trojan', 'spyware'],
    tip: 'A melhor defesa começa com boas escolhas.',
    upgrade: 'Sobrecarga final',
    layout: {
      ground: [[160, 680, 320, 80], [515, 680, 270, 80], [830, 680, 240, 80], [1145, 680, 270, 80], [1470, 680, 260, 80], [1805, 680, 290, 80], [2255, 680, 490, 80]],
      floating: [[200, 530, 150, 22], [500, 470, 150, 22], [800, 530, 150, 22], [1150, 470, 150, 22], [1450, 530, 150, 22], [1750, 470, 150, 22], [2150, 530, 170, 22]],
      terminal: [2255, 600],
      item: [800, 495],
      spawns: [[250, 450], [650, 560], [1100, 450], [1600, 560], [2100, 450]],
      // Pontos seguros (longe de qualquer plataforma) para o boss teleportar na fase 1 dele
      bossTeleports: [[2020, 400], [2180, 400], [2350, 400]]
    }
  },
  {
    title: '6. Núcleo do Hacker',
    color: 0x9d0028,
    enemies: [],
    tip: 'Sistemas mais fortes exigem defesas mais fortes.',
    upgrade: null,
    bossFight: true
  }
];

export const TIPS = {
  virus: 'Mantenha o sistema e os aplicativos atualizados.',
  trojan: 'Não abra arquivos ou programas de origem desconhecida.',
  spyware: 'Proteja suas informações pessoais.',
  phishing: 'Desconfie de links que pedem seus dados.',
  ransomware: 'Mantenha backups dos arquivos importantes.',
  worm: 'Atualizações ajudam a impedir a propagação de ameaças.',
  sentinel: 'Sentinelas automáticas vigiam pontos estratégicos.'
};
