const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

// Store active users
const activeUsers = new Map();

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
    socket.on('community:join', (communityId) => {
      socket.join(`community:${communityId}`);
      console.log(`User ${socket.user.name} joined community ${communityId}`);
    });

    // Leave community room
    socket.on('community:leave', (communityId) => {
      socket.leave(`community:${communityId}`);
      console.log(`User ${socket.user.name} left community ${communityId}`);
    });

    // Send message to community
    socket.on('message:send', async (data) => {
      try {
        const { communityId, content, type } = data;
        
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
        
        const message = await Message.create({
          sender: socket.user._id,
          receiver: receiverId,
          content,
          type: type || 'text',
          isPrivate: true
        });

        await message.populate('sender', 'name avatar role');

        // Send to receiver
        io.to(`user:${receiverId}`).emit('message:private:new', message);
        
        // Send confirmation to sender
        socket.emit('message:private:sent', message);
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
        
        await Message.findByIdAndUpdate(messageId, {
          read: true,
          readAt: new Date()
        });

        // Notify sender
        const message = await Message.findById(messageId);
        if (message) {
          io.to(`user:${message.sender}`).emit('message:read', {
            messageId,
            readBy: socket.user._id
          });
        }
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