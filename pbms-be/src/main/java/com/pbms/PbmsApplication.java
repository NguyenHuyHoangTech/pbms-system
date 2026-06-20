package com.pbms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = "com.pbms")
public class PbmsApplication {

	public static void main(String[] args) {
		SpringApplication.run(PbmsApplication.class, args);
	}

}
