import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AppService } from './app.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';

@Controller('api')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('register')
  async register(
    @Body('name') name: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    const hashedPassword = await bcrypt.hash(password, 12);
    // return this.appService.create({
    //   name,
    //   email,
    //   password: hashedPassword,
    // });

    const user = await this.appService.create({
      name,
      email,
      password: hashedPassword,
    });

    //this way teel pasword in same scope
    // const { password, ...result } = user;
    // return result;
    delete user.password;
    return user;
  }

  // @Post('login')
  // async login(
  //   @Body('email') email: string,
  //   @Body('password') password: string,
  // ) {
  //   const user = await this.appService.findOne({ email: email });

  //   if (!user) {
  //     throw new BadRequestException('invalid creditial');
  //   }

  //   if (!(await bcrypt.compare(password, user.password))) {
  //     throw new BadRequestException('invalid creditial ');
  //   }
  //   return user;
  // }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.appService.findOne({ email: email }); // Pass email as the selection condition

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('Invalid credentials');
    }
    //without jwt
    // return user;

    //withjwt
    // const jwt = await this.jwtService.signAsync({ id: user.id });
    // return jwt;

    // Generate JWT token after successful login
    const jwtToken = await this.jwtService.signAsync({ id: user.id });
    // return { token: jwtToken }; // Return the token to the client

    response.cookie('jwtToken', jwtToken, { httpOnly: true });

    return {
      message: 'success',
    };
  }

  @Get('user')
  async user(@Req() request: Request) {
    try {
      const cookie = request.cookies['jwtToken'];
      // return cookie;

      //will show name pass id
      const data = await this.jwtService.verifyAsync(cookie);

      if (!data) {
        throw new UnauthorizedException();
      }
      // return data;
      const user = await this.appService.findOne({ id: data['id'] });
      // return user;

      const { password, ...result } = user;
      return result;
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('jwtToken');
    return {
      message: 'success',
    };
  }
}
