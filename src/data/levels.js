export const LEVELS = [
  {
    title: '1. Setor de Arquivos',
    color: 0x18d7ff,
    enemies: ['virus', 'virus', 'trojan'],
    tip: 'Não abra arquivos de origem desconhecida.',
    upgrade: 'Plasma concentrado'
  },
  {
    title: '2. Rede de Mensagens',
    color: 0x8b5cf6,
    enemies: ['virus', 'spyware', 'trojan', 'phishing'],
    tip: 'Desconfie de links suspeitos.',
    upgrade: 'Tiro carregado'
  },
  {
    title: '3. Cofre de Credenciais',
    color: 0x22e39a,
    enemies: ['spyware', 'phishing', 'ransomware', 'trojan'],
    tip: 'Use senhas fortes e autenticação em dois fatores.',
    upgrade: 'Plasma perfurante'
  },
  {
    title: '4. Núcleo de Backup',
    color: 0xffb020,
    enemies: ['virus', 'ransomware', 'spyware', 'worm', 'worm'],
    tip: 'Mantenha backups e programas atualizados.',
    upgrade: 'Disparo dividido'
  },
  {
    title: '5. Servidor Central',
    color: 0xff356b,
    enemies: ['virus', 'spyware', 'ransomware'],
    tip: 'A melhor defesa começa com boas escolhas.',
    upgrade: 'Sobrecarga final'
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
  worm: 'Atualizações ajudam a impedir a propagação de ameaças.'
};
