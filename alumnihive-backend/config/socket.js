const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Community = require('../models/Community');
const Mentorship = require('../models/Mentorship');

// Store active users
const activeUsers = new Map();

const canAccessCommunity = async (user, communityId) => {
  const community = await Community.findById(communityId).select('members');

  if (!community) {
    return { allowed: false, reason: 'Community not found' };
  }

  const isMember = community.members.some(
    member => member.user.toString() === user._id.toString()
  );

  if (!isMember && user.role !== 'admin') {
    return { allowed: false, reason: 'Not authorized for this community' };
  }

  return { allowed: true, community };
};

const initializeSocket = (io) => {
  // Authentication middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.name} (${socket.user._id})`);
    
    // Add user to active users
    activeUsers.set(socket.user._id.toString(), {
      socketId: socket.id,
      userId: socket.user._id,
      name: socket.user.name,
      avatar: socket.user.avatar
    });

    // Emit updated online users to all clients
    io.emit('users:online', Array.from(activeUsers.values()));

    // Join user to their personal room
    socket.join(`user:${socket.user._id}`);

    // Join community rooms
    socket.on('community:join', async (communityId) => {
      try {
        const access = await canAccessCommunity(socket.user, communityId);
        if (!access.allowed) {
          return socket.emit('message:error', { message: access.reason });
        }

        socket.join(`community:${communityId}`);
        console.log(`User ${socket.user.name} joined community ${communityId}`);
      } catch (error) {
        socket.emit('message:error', { message: 'Unable to join community room' });
      }
    });

    // Leave community room
    socket.on('community:leave', (communityId) => {
      socket.leave(`community:${communityId}`);
      console.log(`User ${socket.user.name} left community ${communityId}`);
    });

    // Mentorship room events
    socket.on('mentorship:join', async (mentorshipId) => {
      try {
        const mentorship = await Mentorship.findById(mentorshipId).select('mentor mentee');
        if (!mentorship) {
          return socket.emit('message:error', { message: 'Mentorship not found' });
        }

        const isMember = mentorship.mentor.toString() === socket.user._id.toString() ||
          mentorship.mentee.toString() === socket.user._id.toString();

        if (!isMember) {
          return socket.emit('message:error', { message: 'Not authorized for this mentorship' });
        }

        socket.join(`mentorship:${mentorshipId}`);
      } catch (error) {
        socket.emit('message:error', { message: 'Unable to join mentorship room' });
      }
    });

    socket.on('mentorship:leave', (mentorshipId) => {
      socket.leave(`mentorship:${mentorshipId}`);
    });

    socket.on('message:mentorship', async (data) => {
      try {
        const { mentorshipId, content, type } = data;

        if (!mentorshipId || !content || !String(content).trim()) {
          return socket.emit('message:error', { message: 'Mentorship ID and content are required' });
        }

        const mentorship = await Mentorship.findById(mentorshipId).select('mentor mentee');
        if (!mentorship) {
          return socket.emit('message:error', { message: 'Mentorship not found' });
        }

        const isMember = mentorship.mentor.toString() === socket.user._id.toString() ||
          mentorship.mentee.toString() === socket.user._id.toString();

        if (!isMember) {
          return socket.emit('message:error', { message: 'Not authorized' });
        }

        const message = await Message.create({
          sender: socket.user._id,
          mentorship: mentorshipId,
          content,
          type: type || 'text'
        });

        await message.populate('sender', 'name avatar role');

        io.to(`mentorship:${mentorshipId}`).emit('message:mentorship:new', message);
      } catch (error) {
        socket.emit('message:error', { message: error.message });
      }
    });

    // Send message to community
    socket.on('message:send', async (data) => {
      try {
        const { communityId, content, type } = data;

        if (!communityId || !content || !String(content).trim()) {
          return socket.emit('message:error', { message: 'Community and content are required' });
        }

        const access = await canAccessCommunity(socket.user, communityId);
        if (!access.allowed) {
          return socket.emit('message:error', { message: access.reason });
        }
        
        const message = await Message.create({
          sender: socket.user._id,
          community: communityId,
          content,
          type: type || 'text'
        });

        await message.populate('sender', 'name avatar role');

        // Broadcast to community room
        io.to(`community:${communityId}`).emit('message:new', message);
      } catch (error) {
        socket.emit('message:error', { message: error.message });
      }
    });

    // Private message
    socket.on('message:private', async (data) => {
      try {
        const { receiverId, content, type } = data;

        if (!receiverId || !content || !String(content).trim()) {
          return socket.emit('message:error', { message: 'Receiver and content are required' });
        }

        if (receiverId.toString() === socket.user._id.toString()) {
          return socket.emit('message:error', { message: 'Cannot send message to yourself' });
        }

        const receiver = await User.findById(receiverId).select('_id name avatar role');
        if (!receiver) {
          return socket.emit('message:error', { message: 'Receiver not found' });
        }

        if (receiver.isBlocked) {
          return socket.emit('message:error', { message: 'Cannot message blocked user' });
        }
        
        const message = await Message.create({
          sender: socket.user._id,
          receiver: receiverId,
          content,
          type: type || 'text',
          isPrivate: true
        });

        await message.populate('sender', 'name avatar role');
        await message.populate('receiver', 'name avatar role');

        // Send to receiver
        io.to(`user:${receiverId}`).emit('message:private:new', message);
        
        // Emit to sender as well so sender UI updates in real time with same payload shape.
        socket.emit('message:private:new', message);
      } catch (error) {
        socket.emit('message:error', { message: error.message });
      }
    });

    // Typing indicator
    socket.on('typing:start', (data) => {
      const { communityId, receiverId } = data;
      
      if (communityId) {
        socket.to(`community:${communityId}`).emit('typing:start', {
          userId: socket.user._id,
          userName: socket.user.name
        });
      } else if (receiverId) {
        io.to(`user:${receiverId}`).emit('typing:start', {
          userId: socket.user._id,
          userName: socket.user.name
        });
      }
    });

    socket.on('typing:stop', (data) => {
      const { communityId, receiverId } = data;
      
      if (communityId) {
        socket.to(`community:${communityId}`).emit('typing:stop', {
          userId: socket.user._id
        });
      } else if (receiverId) {
        io.to(`user:${receiverId}`).emit('typing:stop', {
          userId: socket.user._id
        });
      }
    });

    // Message read receipt
    socket.on('message:read', async (data) => {
      try {
        const { messageId } = data;

        const message = await Message.findById(messageId);
        if (!message) {
          return socket.emit('message:error', { message: 'Message not found' });
        }

        if (message.isPrivate) {
          if (!message.receiver || message.receiver.toString() !== socket.user._id.toString()) {
            return socket.emit('message:error', { message: 'Not authorized to mark this message as read' });
          }
        } else {
          if (!message.community) {
            return socket.emit('message:error', { message: 'Community message is missing community reference' });
          }

          const access = await canAccessCommunity(socket.user, message.community);
          if (!access.allowed) {
            return socket.emit('message:error', { message: 'Not authorized to mark this message as read' });
          }
        }
        
        await Message.findByIdAndUpdate(messageId, {
          read: true,
          readAt: new Date()
        });

        // Notify sender
        io.to(`user:${message.sender}`).emit('message:read', {
          messageId,
          readBy: socket.user._id
        });
      } catch (error) {
        console.error('Read receipt error:', error);
      }
    });

    // Notification events
    socket.on('notification:send', (data) => {
      const { userId, notification } = data;
      io.to(`user:${userId}`).emit('notification:new', notification);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.name}`);
      activeUsers.delete(socket.user._id.toString());
      
      // Emit updated online users
      io.emit('users:online', Array.from(activeUsers.values()));
    });
  });

  return io;
};

module.exports = { initializeSocket, activeUsers };