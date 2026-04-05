export const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };
  
  export const getAvatarColor = (name) => {
    const colors = [
      'bg-[#395917]', 'bg-[#85AA9B]', 'bg-[#27868B]', 
      'bg-[#3D513B]', 'bg-[#5C7361]', 'bg-[#D8E3DC]'
    ];
    const index = name?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    return colors[index % colors.length];
  };