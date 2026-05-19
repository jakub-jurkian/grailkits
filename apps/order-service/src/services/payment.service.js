const VALID_METHODS = ['CARD', 'TRANSFER', 'BLIK'];
const VALID_STATUSES = ['PENDING', 'AUTHORIZED', 'FAILED', 'REFUNDED'];

// Payment state machine:
//   PENDING -> AUTHORIZED   (success)
//   PENDING -> FAILED       (declined / provider error)
//   AUTHORIZED -> REFUNDED  (out of scope for this iteration)
class PaymentService {
  constructor(paymentRepository, orderRepository = null) {
    this.paymentRepository = paymentRepository;
    this.orderRepository = orderRepository;
  }

  async create({ orderId, amount, method }) {
    if (!orderId || typeof orderId !== 'string') {
      const err = new Error('orderId is required');
      err.statusCode = 400;
      throw err;
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      const err = new Error('amount must be a positive integer (grosze)');
      err.statusCode = 400;
      throw err;
    }
    const m = method || 'CARD';
    if (!VALID_METHODS.includes(m)) {
      const err = new Error('method must be one of: ' + VALID_METHODS.join(', '));
      err.statusCode = 400;
      throw err;
    }

    if (this.orderRepository) {
      const order = await this.orderRepository.findById(orderId);
      if (!order) {
        const err = new Error('Order not found: ' + orderId);
        err.statusCode = 404;
        throw err;
      }
    }

    return await this.paymentRepository.create({ orderId, amount, method: m });
  }

  async authorize(paymentId, payload = {}) {
    const current = await this.paymentRepository.findById(paymentId);
    if (!current) {
      const err = new Error('Payment not found');
      err.statusCode = 404;
      throw err;
    }
    if (current.status !== 'PENDING') {
      const err = new Error(
        'Payment cannot be authorized from status: ' + current.status
      );
      err.statusCode = 409;
      throw err;
    }
    return await this.paymentRepository.transitionStatus(
      paymentId,
      'AUTHORIZED',
      payload
    );
  }

  async markFailed(paymentId, reason) {
    const current = await this.paymentRepository.findById(paymentId);
    if (!current) {
      const err = new Error('Payment not found');
      err.statusCode = 404;
      throw err;
    }
    if (current.status !== 'PENDING') {
      const err = new Error(
        'Payment cannot be marked failed from status: ' + current.status
      );
      err.statusCode = 409;
      throw err;
    }
    return await this.paymentRepository.transitionStatus(
      paymentId,
      'FAILED',
      { reason: reason || 'unknown' }
    );
  }

  async getById(paymentId) {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      const err = new Error('Payment not found');
      err.statusCode = 404;
      throw err;
    }
    return payment;
  }

  async countByStatus(status) {
    if (!status || !VALID_STATUSES.includes(status)) {
      const err = new Error(
        'status must be one of: ' + VALID_STATUSES.join(', ')
      );
      err.statusCode = 400;
      throw err;
    }
    return await this.paymentRepository.countByStatus(status);
  }
}

module.exports = PaymentService;
